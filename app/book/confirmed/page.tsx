import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingById } from '@/lib/booking';

function maskPhone(phone: string): string {
  // 0812345678 → 081-XXX-5678
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-XXX-${phone.slice(6)}`;
}

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

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const booking = await getBookingById(id);
  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-900">
        <h1 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
          Booking confirmed
        </h1>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-emerald-800 dark:text-emerald-300">Phone</dt>
            <dd className="font-medium text-emerald-950 dark:text-emerald-50">
              {maskPhone(booking.phone)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emerald-800 dark:text-emerald-300">Date</dt>
            <dd className="font-medium text-emerald-950 dark:text-emerald-50">
              {formatDateLabel(booking.bookedOn)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-emerald-800 dark:text-emerald-300">Time</dt>
            <dd className="font-medium text-emerald-950 dark:text-emerald-50">
              {booking.slotTime}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        Save your phone number to look up this booking later.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/book"
          className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Book another appointment
        </Link>
        <Link
          href="/"
          className="rounded-md px-4 py-2 text-center text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
