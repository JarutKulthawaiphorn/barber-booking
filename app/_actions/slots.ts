'use server';

import {
  listBookingsOnDate,
  slotsWithStatus,
  type SlotStatus,
} from '@/lib/booking';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Same-origin slot lookup used by the customer and admin booking forms.
 *
 * Replaces the prior `/api/slots` route handler — both forms render inside
 * this app and never need an external HTTP entry point, so calling a server
 * action from the client avoids the extra fetch + JSON round trip and keeps
 * types end-to-end.
 *
 * Throws on bad input so callers can surface the message; the React hook
 * wrapping this catches and renders the failure inline.
 */
export async function fetchSlots(date: string): Promise<SlotStatus[]> {
  if (!DATE_RE.test(date)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }

  const today = todayInBangkok();
  const [settings, closedDates, existingBookings] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today }),
    listBookingsOnDate(date),
  ]);

  return slotsWithStatus({
    settings,
    closedDates,
    existingBookings,
    date,
    today,
  });
}
