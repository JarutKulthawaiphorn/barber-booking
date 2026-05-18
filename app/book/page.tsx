import Link from 'next/link';

import {
  availableSlots,
  listBookableDates,
  listBookingsOnDate,
} from '@/lib/booking';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

import { BookingForm } from './_components/booking-form';

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
  const initialSlots = initialDate
    ? availableSlots({
        settings,
        closedDates,
        existingBookings: initialBookings,
        date: initialDate,
        today,
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <Link href="/" className="reveal reveal-d1 btn-link inline-block">
        ← The Bangkok Barber
      </Link>

      <header className="reveal reveal-d2 mt-10">
        <p className="tracking-mark text-xs text-brass">№ 02 — Reserve</p>
        <h1 className="font-display mt-4 text-5xl leading-tight text-ink sm:text-6xl">
          Reserve <em className="text-burgundy not-italic font-display italic">a chair</em>
        </h1>
        <p className="ornament-rule mt-6 text-xs tracking-mark">
          <span>Half-hour appointments</span>
        </p>
      </header>

      {params.error ? (
        <p className="reveal reveal-d3 banner-error mt-8" role="alert">
          {params.error}
        </p>
      ) : null}

      <section className="reveal reveal-d3 corner-brackets card-paper mt-10 p-7 sm:p-10">
        <BookingForm
          bookableDates={bookableDates}
          initialDate={initialDate}
          initialSlots={initialSlots}
        />
      </section>

      <p className="mt-8 text-xs tracking-mark text-ink-faint text-center">
        Times shown in Asia / Bangkok
      </p>
    </main>
  );
}
