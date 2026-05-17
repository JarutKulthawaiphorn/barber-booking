import Link from 'next/link';

import { getBookingsByPhone, type Booking } from '@/lib/booking';
import { todayInBangkok } from '@/lib/timezone';

import { cancelBookingAction, lookupBookingsAction } from './actions';

const inputClass =
  'mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

const primaryButtonClass =
  'rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200';

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

async function loadBookings(
  phone: string,
): Promise<{ upcoming: Booking[]; past: Booking[]; lookupError: string | null }> {
  try {
    const all = await getBookingsByPhone(phone);
    const today = todayInBangkok();
    const upcoming = all.filter((b) => b.bookedOn >= today);
    const past = all.filter((b) => b.bookedOn < today);
    return { upcoming, past, lookupError: null };
  } catch (err) {
    return {
      upcoming: [],
      past: [],
      lookupError: err instanceof Error ? err.message : 'Could not look up bookings',
    };
  }
}

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const phone = params.phone ?? null;

  const results = phone ? await loadBookings(phone) : null;

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Look up your booking
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the phone number you booked with.
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
      {params.ok ? (
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {params.ok}
        </p>
      ) : null}

      <section className="mt-8">
        <form action={lookupBookingsAction} className="grid grid-cols-1 gap-4">
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">Phone</span>
            <input
              type="tel"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              required
              defaultValue={phone ?? ''}
              placeholder="0812345678"
              pattern="[0-9\s-]*"
              maxLength={15}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Thai mobile only — 10 digits starting with 06, 08, or 09.
            </span>
          </label>

          <button type="submit" className={primaryButtonClass}>
            Look up
          </button>
        </form>
      </section>

      {results ? (
        <section className="mt-10">
          {results.lookupError ? (
            <p
              className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              role="alert"
            >
              {results.lookupError}
            </p>
          ) : results.upcoming.length === 0 && results.past.length === 0 ? (
            <p className="rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              No bookings found for that phone number.
            </p>
          ) : (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Upcoming
              </h2>
              {results.upcoming.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  No upcoming booking.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {results.upcoming.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-900"
                    >
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-emerald-800 dark:text-emerald-300">Date</dt>
                          <dd className="font-medium text-emerald-950 dark:text-emerald-50">
                            {formatDateLabel(b.bookedOn)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-emerald-800 dark:text-emerald-300">Time</dt>
                          <dd className="font-medium text-emerald-950 dark:text-emerald-50">
                            {b.slotTime}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-emerald-800 dark:text-emerald-300">Phone</dt>
                          <dd className="font-medium text-emerald-950 dark:text-emerald-50">
                            {maskPhone(b.phone)}
                          </dd>
                        </div>
                      </dl>
                      <form action={cancelBookingAction} className="mt-4 flex justify-end">
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="phone" value={b.phone} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-red-700 hover:underline dark:text-red-400"
                        >
                          Cancel booking
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {results.past.length > 0 ? (
                <>
                  <h2 className="mt-10 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    Previous visits
                  </h2>
                  <ul className="mt-3 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {results.past.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {formatDateLabel(b.bookedOn)}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">{b.slotTime}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

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
