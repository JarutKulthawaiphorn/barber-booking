import type { ClosedDate, ShopSettings } from './shop-settings';

export const SLOT_MINUTES = 30;
export const LOOK_AHEAD_DAYS = 14;

export type Booking = {
  id: string;
  phone: string;
  customerName: string;
  /** Set only when an admin booked on behalf of the customer. */
  barberName: string | null;
  bookedOn: string;
  slotTime: string;
};

export type SlotStatus = {
  time: string;
  taken: boolean;
};

export const NAME_MIN = 2;
export const NAME_MAX = 24;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Thai mobile: leading 0, second digit 6/8/9, then 8 more digits.
// The DB CHECK constraint is looser; this app-level check is the gate.
const THAI_MOBILE_RE = /^0[689]\d{8}$/;

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

/** Trim and collapse internal whitespace, then enforce 2-24 char length. */
export function validateCustomerName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length < NAME_MIN || cleaned.length > NAME_MAX) {
    throw new Error(`Name must be ${NAME_MIN}-${NAME_MAX} characters`);
  }
  return cleaned;
}

/** Same rules as customer name; used when admin assigns a barber. */
export function validateBarberName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length < NAME_MIN || cleaned.length > NAME_MAX) {
    throw new Error(`Barber name must be ${NAME_MIN}-${NAME_MAX} characters`);
  }
  return cleaned;
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
 * Weekday for a YYYY-MM-DD string. 0 = Sunday ... 6 = Saturday, matching
 * JS Date.getDay. Parses as UTC midnight so the result is timezone-neutral.
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
  const weeklyClosed = args.settings.weeklyClosedWeekday;
  const out: string[] = [];
  for (let i = 0; i < lookAhead; i++) {
    const d = addDays(args.today, i);
    if (weeklyClosed !== null && getWeekday(d) === weeklyClosed) continue;
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

/**
 * All slots for `date` with a `taken` flag, so the UI can render reserved slots
 * as disabled buttons instead of hiding them. Returns an empty array if the
 * date is outside the bookable window.
 */
export function slotsWithStatus(args: {
  settings: ShopSettings;
  closedDates: ClosedDate[];
  existingBookings: Pick<Booking, 'slotTime'>[];
  date: string;
  today: string;
  lookAheadDays?: number;
}): SlotStatus[] {
  if (!listBookableDates(args).includes(args.date)) return [];
  const taken = new Set(args.existingBookings.map((b) => b.slotTime));
  return enumerateSlots(args.settings.openTime, args.settings.closeTime).map((time) => ({
    time,
    taken: taken.has(time),
  }));
}
