import Link from 'next/link';

import { requireAdmin } from '@/lib/auth';
import { listBookingsOnDate } from '@/lib/booking';
import { todayInBangkok } from '@/lib/timezone';

import { inputClass, primaryButtonClass } from '../_styles';
import { BookingRow } from './_components/booking-row';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDateLabel(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; ok?: string }>;
}) {
  const username = await requireAdmin();
  const params = await searchParams;
  const today = todayInBangkok();
  const date = params.date && DATE_RE.test(params.date) ? params.date : today;

  const bookings = await listBookingsOnDate(date);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Manage bookings
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          ← Shop settings
        </Link>
      </header>

      {params.error ? (
        <p
          className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {params.error}
        </p>
      ) : null}
      {params.ok ? (
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {params.ok}
        </p>
      ) : null}

      <section className="mt-10">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              required
              className={inputClass}
            />
          </label>
          <button type="submit" className={primaryButtonClass}>
            View
          </button>
        </form>

        <h2 className="mt-8 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {formatDateLabel(date)}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {bookings.length === 0
            ? 'No bookings on this date.'
            : `${bookings.length} booking${bookings.length === 1 ? '' : 's'}.`}
        </p>

        {bookings.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {bookings.map((b) => (
              <BookingRow
                key={b.id}
                id={b.id}
                slotTime={b.slotTime}
                phone={b.phone}
                date={date}
              />
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
