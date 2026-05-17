import { getSupabase } from './supabase/server';
import type { ClosedDate, ShopSettings } from './shop-settings';
import {
  getShopSettings,
  listClosedDates,
} from './shop-settings';
import { todayInBangkok } from './timezone';

export const SLOT_MINUTES = 30;
export const LOOK_AHEAD_DAYS = 14;

export type Booking = {
  id: string;
  phone: string;
  bookedOn: string;
  slotTime: string;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Thai mobile: leading 0, second digit 6/8/9, then 8 more digits.
// (The DB CHECK constraint is the looser ^0[6-9]\d{8}$; this app-level check is the gate.)
const THAI_MOBILE_RE = /^0[689]\d{8}$/;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function parseTimeMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

function formatMinutesAsTime(m: number): string {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

export function validatePhone(raw: string): string {
  const normalized = normalizePhone(raw);
  if (!THAI_MOBILE_RE.test(normalized)) {
    throw new Error(
      'Phone number must be a Thai mobile (10 digits, starting with 06, 08, or 09)',
    );
  }
  return normalized;
}

/**
 * Half-hour slot starts inside [open, close - 30min].
 * Sub-30-minute remainder at the end is dropped.
 */
export function enumerateSlots(openHHMM: string, closeHHMM: string): string[] {
  if (!TIME_RE.test(openHHMM) || !TIME_RE.test(closeHHMM)) {
    throw new Error('open/close must be in HH:MM 24-hour format');
  }
  const open = parseTimeMinutes(openHHMM);
  const close = parseTimeMinutes(closeHHMM);
  if (open >= close) return [];
  const slots: string[] = [];
  for (let t = open; t + SLOT_MINUTES <= close; t += SLOT_MINUTES) {
    slots.push(formatMinutesAsTime(t));
  }
  return slots;
}

/**
 * Weekday for a YYYY-MM-DD string. 0 = Sunday … 6 = Saturday, matching JS Date.getDay.
 * Parses as UTC midnight so the result is independent of system timezone.
 */
export function getWeekday(yyyyMmDd: string): number {
  if (!DATE_RE.test(yyyyMmDd)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(yyyyMmDd: string, n: number): string {
  if (!DATE_RE.test(yyyyMmDd)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear().toString().padStart(4, '0');
  const mm = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = dt.getUTCDate().toString().padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Dates a customer may pick: [today, today + LOOK_AHEAD_DAYS - 1], minus the
 * weekly closed weekday and any one-off closed dates inside the window.
 */
export function listBookableDates(args: {
  settings: ShopSettings;
  closedDates: ClosedDate[];
  today: string;
  lookAheadDays?: number;
}): string[] {
  const lookAhead = args.lookAheadDays ?? LOOK_AHEAD_DAYS;
  const closedSet = new Set(args.closedDates.map((c) => c.closedOn));
  const out: string[] = [];
  for (let i = 0; i < lookAhead; i++) {
    const d = addDays(args.today, i);
    if (getWeekday(d) === args.settings.weeklyClosedWeekday) continue;
    if (closedSet.has(d)) continue;
    out.push(d);
  }
  return out;
}

/**
 * Slot times still available on `date`, given existing bookings for that date.
 * Returns an empty array if the date is outside the bookable window.
 */
export function availableSlots(args: {
  settings: ShopSettings;
  closedDates: ClosedDate[];
  existingBookings: Pick<Booking, 'slotTime'>[];
  date: string;
  today: string;
  lookAheadDays?: number;
}): string[] {
  if (!listBookableDates(args).includes(args.date)) return [];
  const taken = new Set(args.existingBookings.map((b) => b.slotTime));
  return enumerateSlots(args.settings.openTime, args.settings.closeTime).filter(
    (s) => !taken.has(s),
  );
}

// ---------------------------------------------------------------------------
// DAL
// ---------------------------------------------------------------------------

function rowToBooking(row: {
  id: string;
  phone: string;
  booked_on: string;
  slot_time: string;
}): Booking {
  return {
    id: row.id,
    phone: row.phone,
    bookedOn: row.booked_on,
    slotTime: String(row.slot_time).slice(0, 5),
  };
}

export async function listBookingsOnDate(date: string): Promise<Booking[]> {
  if (!DATE_RE.test(date)) throw new Error('date must be in YYYY-MM-DD format');
  const { data, error } = await getSupabase()
    .from('bookings')
    .select('id, phone, booked_on, slot_time')
    .eq('booked_on', date)
    .order('slot_time');
  if (error) throw new Error(`Failed to list bookings: ${error.message}`);
  return (data ?? []).map((row) =>
    rowToBooking(row as { id: string; phone: string; booked_on: string; slot_time: string }),
  );
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await getSupabase()
    .from('bookings')
    .select('id, phone, booked_on, slot_time')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load booking: ${error.message}`);
  if (!data) return null;
  return rowToBooking(data as { id: string; phone: string; booked_on: string; slot_time: string });
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const normalized = validatePhone(phone);
  const { data, error } = await getSupabase()
    .from('bookings')
    .select('id, phone, booked_on, slot_time')
    .eq('phone', normalized)
    .order('booked_on')
    .order('slot_time');
  if (error) throw new Error(`Failed to list bookings: ${error.message}`);
  return (data ?? []).map((row) =>
    rowToBooking(row as { id: string; phone: string; booked_on: string; slot_time: string }),
  );
}

/**
 * Delete a future booking matched by both id and phone (so users can only cancel
 * their own). Past bookings are not cancellable. Throws "Booking not found" for
 * any mismatch — id wrong, phone wrong, or already past — without leaking which.
 */
export async function cancelBooking(args: { id: string; phone: string }): Promise<void> {
  if (!UUID_RE.test(args.id)) throw new Error('Booking not found');
  const phone = validatePhone(args.phone);
  const today = todayInBangkok();

  const { data, error } = await getSupabase()
    .from('bookings')
    .delete()
    .eq('id', args.id)
    .eq('phone', phone)
    .gte('booked_on', today)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Failed to cancel booking: ${error.message}`);
  if (!data) throw new Error('Booking not found');
}

/**
 * Validate, check the active-booking cap, and insert. Returns the new booking row.
 * Maps the unique-constraint violation to a user-facing "slot just taken" message.
 */
export async function createBooking(input: {
  phone: string;
  bookedOn: string;
  slotTime: string;
}): Promise<Booking> {
  const phone = validatePhone(input.phone);

  if (!DATE_RE.test(input.bookedOn)) {
    throw new Error('Please pick a valid date');
  }
  if (!TIME_RE.test(input.slotTime)) {
    throw new Error('Please pick a valid time slot');
  }

  const today = todayInBangkok();
  const [settings, closedDates] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today, to: addDays(today, LOOK_AHEAD_DAYS - 1) }),
  ]);

  const bookable = listBookableDates({ settings, closedDates, today });
  if (!bookable.includes(input.bookedOn)) {
    throw new Error('That date is not available for booking');
  }

  const validSlots = enumerateSlots(settings.openTime, settings.closeTime);
  if (!validSlots.includes(input.slotTime)) {
    throw new Error('That time slot is not within shop hours');
  }

  // Active-booking cap: one future booking per phone.
  const { data: existing, error: existingErr } = await getSupabase()
    .from('bookings')
    .select('id')
    .eq('phone', phone)
    .gte('booked_on', today)
    .limit(1);
  if (existingErr) throw new Error(`Failed to check existing bookings: ${existingErr.message}`);
  if (existing && existing.length > 0) {
    throw new Error(
      'This phone number already has an upcoming booking. Please use that one or contact the shop.',
    );
  }

  const { data, error } = await getSupabase()
    .from('bookings')
    .insert({ phone, booked_on: input.bookedOn, slot_time: input.slotTime })
    .select('id, phone, booked_on, slot_time')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('That slot was just taken — please pick another');
    }
    if (error.code === '23514') {
      // CHECK constraint (phone regex at DB level)
      throw new Error(
        'Phone number must be a Thai mobile (10 digits, starting with 06, 08, or 09)',
      );
    }
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return rowToBooking(data as { id: string; phone: string; booked_on: string; slot_time: string });
}
