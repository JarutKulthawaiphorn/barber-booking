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
    <main className="mx-auto max-w-md px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Book an appointment
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a date and a 30-minute slot. Times are Asia/Bangkok.
        </p>
      </header>

      {params.error ? (
        <p
          className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {params.error}
        </p>
      ) : null}

      <section className="mt-8">
        <BookingForm
          bookableDates={bookableDates}
          initialDate={initialDate}
          initialSlots={initialSlots}
        />
      </section>

      <p className="mt-10 text-sm">
        <Link
          href="/"
          className="text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
