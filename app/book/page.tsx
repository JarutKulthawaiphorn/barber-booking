import type { Metadata } from 'next';
import Link from 'next/link';

import {
  LOOK_AHEAD_DAYS,
  addDays,
  listBookableDates,
  listBookingsOnDate,
  slotsWithStatus,
  type SlotStatus,
} from '@/lib/booking';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

import { BookingForm } from './_components/booking-form';

export const metadata: Metadata = {
  title: 'Book a chair',
  description:
    'Pick a 30-minute slot at The Bangkok Barber. Two-week booking window.',
};

export const dynamic = 'force-dynamic';

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const today = todayInBangkok();

  const [settings, closedDates, params] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today }),
    searchParams,
  ]);

  const bookableDates = listBookableDates({ settings, closedDates, today });
  const initialDate = bookableDates[0] ?? null;
  const initialBookings = initialDate ? await listBookingsOnDate(initialDate) : [];
  const initialSlots: SlotStatus[] = initialDate
    ? slotsWithStatus({
        settings,
        closedDates,
        existingBookings: initialBookings,
        date: initialDate,
        today,
      })
    : [];

  const dayGrid: string[] = Array.from({ length: LOOK_AHEAD_DAYS }, (_, i) =>
    addDays(today, i),
  );
  const bookableSet = new Set(bookableDates);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-2 pb-10 sm:px-6">
      {/* Header */}
      <header
        className="flex min-h-[56px] items-center gap-2 px-1"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          aria-label="Back"
          style={{ padding: '0 8px', marginLeft: -8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-[17px] font-semibold">Book a chair</h1>
      </header>

      {params.error ? (
        <p className="banner banner-error mt-4" role="alert">
          {params.error}
        </p>
      ) : null}

      <BookingForm
        dayGrid={dayGrid.map((d) => ({ date: d, open: bookableSet.has(d) }))}
        initialDate={initialDate}
        initialSlots={initialSlots}
      />

      <p
        className="mt-6 text-center text-[12px]"
        style={{ color: 'var(--color-muted)' }}
      >
        Times shown in Asia / Bangkok · GMT+7
      </p>
    </main>
  );
}
