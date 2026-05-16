import { type NextRequest } from 'next/server';

import {
  availableSlots,
  listBookingsOnDate,
} from '@/lib/booking';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest): Promise<Response> {
  const date = request.nextUrl.searchParams.get('date');

  if (!date || !DATE_RE.test(date)) {
    return Response.json(
      { error: 'date query param must be YYYY-MM-DD' },
      { status: 400 },
    );
  }

  const today = todayInBangkok();
  const [settings, closedDates, existingBookings] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today }),
    listBookingsOnDate(date),
  ]);

  const slots = availableSlots({
    settings,
    closedDates,
    existingBookings,
    date,
    today,
  });

  return Response.json({ slots });
}
