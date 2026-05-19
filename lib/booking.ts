import 'server-only';

import {
  LOOK_AHEAD_DAYS,
  addDays,
  enumerateSlots,
  listBookableDates,
  validateBarberName,
  validateCustomerName,
  validatePhone,
  type Booking,
} from './booking-domain';
import { getSupabase } from './supabase/server';
import { getShopSettings, listClosedDates } from './shop-settings';
import { todayInBangkok } from './timezone';

export {
  LOOK_AHEAD_DAYS,
  NAME_MAX,
  NAME_MIN,
  SLOT_MINUTES,
  addDays,
  availableSlots,
  enumerateSlots,
  getWeekday,
  listBookableDates,
  normalizePhone,
  slotsWithStatus,
  validateBarberName,
  validateCustomerName,
  validatePhone,
} from './booking-domain';
export type { Booking, SlotStatus } from './booking-domain';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type BookingRow = {
  id: string;
  phone: string;
  customer_name: string;
  barber_name: string | null;
  booked_on: string;
  slot_time: string;
};

const BOOKING_COLUMNS = 'id, phone, customer_name, barber_name, booked_on, slot_time';

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    phone: row.phone,
    customerName: row.customer_name,
    barberName: row.barber_name,
    bookedOn: row.booked_on,
    slotTime: String(row.slot_time).slice(0, 5),
  };
}

export async function listBookingsOnDate(date: string): Promise<Booking[]> {
  if (!DATE_RE.test(date)) throw new Error('date must be in YYYY-MM-DD format');
  const { data, error } = await getSupabase()
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('booked_on', date)
    .order('slot_time');
  if (error) throw new Error(`Failed to list bookings: ${error.message}`);
  return (data ?? []).map((row) => rowToBooking(row as BookingRow));
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await getSupabase()
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load booking: ${error.message}`);
  if (!data) return null;
  return rowToBooking(data as BookingRow);
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const normalized = validatePhone(phone);
  const { data, error } = await getSupabase()
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('phone', normalized)
    .order('booked_on')
    .order('slot_time');
  if (error) throw new Error(`Failed to list bookings: ${error.message}`);
  return (data ?? []).map((row) => rowToBooking(row as BookingRow));
}

/**
 * Admin-only: delete any booking by id, regardless of phone or date.
 * Past-date deletions are intentionally allowed because admin is trusted and
 * this data is operational state, not an audit log.
 */
export async function adminCancelBooking(id: string): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error('ไม่พบการจอง');

  const { data, error } = await getSupabase()
    .from('bookings')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถยกเลิกการจองได้: ${error.message}`);
  if (!data) throw new Error('ไม่พบการจอง');
}

/**
 * Delete a future booking matched by both id and phone so users can only cancel
 * their own. Past bookings are not cancellable. Throws "Booking not found" for
 * any mismatch without leaking which part failed.
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

  if (error) throw new Error(`ไม่สามารถยกเลิกการจองได้: ${error.message}`);
  if (!data) throw new Error('ไม่พบการจอง');
}

async function insertBooking(row: {
  phone: string;
  customer_name: string;
  barber_name: string | null;
  booked_on: string;
  slot_time: string;
}): Promise<Booking> {
  const { data, error } = await getSupabase()
    .from('bookings')
    .insert(row)
    .select(BOOKING_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('คิวนี้เพิ่งถูกจอง กรุณาเลือกเวลาอื่น');
    }
    if (error.code === '23514') {
      throw new Error(
        'เบอร์ต้องเป็นมือถือไทย 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09',
      );
    }
    throw new Error(`ไม่สามารถสร้างการจองได้: ${error.message}`);
  }

  return rowToBooking(data as BookingRow);
}

/**
 * Validate and insert a customer-side booking. Returns the new booking row.
 * Customers may have multiple upcoming bookings; the only collision check is
 * the DB-level unique constraint on date and slot.
 */
export async function createBooking(input: {
  phone: string;
  customerName: string;
  bookedOn: string;
  slotTime: string;
}): Promise<Booking> {
  const phone = validatePhone(input.phone);
  const customerName = validateCustomerName(input.customerName);

  if (!DATE_RE.test(input.bookedOn)) {
    throw new Error('กรุณาเลือกวันที่ที่ถูกต้อง');
  }
  if (!TIME_RE.test(input.slotTime)) {
    throw new Error('กรุณาเลือกเวลาที่ถูกต้อง');
  }

  const today = todayInBangkok();
  const [settings, closedDates] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today, to: addDays(today, LOOK_AHEAD_DAYS - 1) }),
  ]);

  const bookable = listBookableDates({ settings, closedDates, today });
  if (!bookable.includes(input.bookedOn)) {
    throw new Error('ไม่สามารถจองในวันนี้ได้');
  }

  const validSlots = enumerateSlots(settings.openTime, settings.closeTime);
  if (!validSlots.includes(input.slotTime)) {
    throw new Error('เวลานี้อยู่นอกเวลาทำการของร้าน');
  }

  return insertBooking({
    phone,
    customer_name: customerName,
    barber_name: null,
    booked_on: input.bookedOn,
    slot_time: input.slotTime,
  });
}

/**
 * Admin-side booking creation. Same validation as customer flow, plus a
 * required `barberName` that appears on the booking card.
 */
export async function adminCreateBooking(input: {
  phone: string;
  customerName: string;
  barberName: string;
  bookedOn: string;
  slotTime: string;
}): Promise<Booking> {
  const phone = validatePhone(input.phone);
  const customerName = validateCustomerName(input.customerName);
  const barberName = validateBarberName(input.barberName);

  if (!DATE_RE.test(input.bookedOn)) {
    throw new Error('กรุณาเลือกวันที่ที่ถูกต้อง');
  }
  if (!TIME_RE.test(input.slotTime)) {
    throw new Error('กรุณาเลือกเวลาที่ถูกต้อง');
  }

  const today = todayInBangkok();
  const [settings, closedDates] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today, to: addDays(today, LOOK_AHEAD_DAYS - 1) }),
  ]);

  const bookable = listBookableDates({ settings, closedDates, today });
  if (!bookable.includes(input.bookedOn)) {
    throw new Error('ไม่สามารถจองในวันนี้ได้');
  }

  const validSlots = enumerateSlots(settings.openTime, settings.closeTime);
  if (!validSlots.includes(input.slotTime)) {
    throw new Error('เวลานี้อยู่นอกเวลาทำการของร้าน');
  }

  return insertBooking({
    phone,
    customer_name: customerName,
    barber_name: barberName,
    booked_on: input.bookedOn,
    slot_time: input.slotTime,
  });
}
