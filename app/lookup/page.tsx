import type { Metadata } from 'next';
import Link from 'next/link';

import { getBookingsByPhone, type Booking } from '@/lib/booking';
import { todayInBangkok } from '@/lib/timezone';

import { cancelBookingAction, lookupBookingsAction } from './actions';

export const metadata: Metadata = {
  title: 'Find your booking',
  robots: { index: false, follow: false },
};

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
    <main className="mx-auto w-full max-w-xl px-6 py-12 sm:py-16">
      <Link href="/" className="reveal reveal-d1 btn-link inline-block">
        ← The Bangkok Barber
      </Link>

      <header className="reveal reveal-d2 mt-10">
        <p className="tracking-mark text-xs text-brass">№ 04 — Look up</p>
        <h1 className="font-display mt-4 text-5xl leading-tight text-ink sm:text-6xl">
          Find your <em className="font-display italic text-burgundy not-italic">appointment</em>
        </h1>
        <p className="mt-4 text-sm text-ink-soft">
          Enter the phone number you booked with.
        </p>
      </header>

      {params.error ? (
        <p className="reveal reveal-d3 banner-error mt-8" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? (
        <p className="reveal reveal-d3 banner-ok mt-8">{params.ok}</p>
      ) : null}

      <section className="reveal reveal-d3 corner-brackets card-paper mt-10 p-7 sm:p-8">
        <form action={lookupBookingsAction} className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="label-mark">Phone</span>
            <input
              type="tel"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              required
              defaultValue={phone ?? ''}
              placeholder="081 234 5678"
              pattern="[0-9\s-]*"
              maxLength={15}
              className="input-vintage numerals"
            />
          </label>

          <button type="submit" className="btn-primary">
            Look up
          </button>
        </form>
      </section>

      {results ? (
        <section className="reveal reveal-d4 mt-12">
          {results.lookupError ? (
            <p className="banner-error" role="alert">
              {results.lookupError}
            </p>
          ) : results.upcoming.length === 0 && results.past.length === 0 ? (
            <p className="banner-warn">
              No bookings found for that phone number.
            </p>
          ) : (
            <>
              <p className="ornament-rule text-xs tracking-mark">
                <span>Upcoming</span>
              </p>

              {results.upcoming.length === 0 ? (
                <p className="mt-5 text-center text-sm italic text-ink-faint">
                  No upcoming booking.
                </p>
              ) : (
                <ul className="mt-6 space-y-5">
                  {results.upcoming.map((b) => (
                    <li key={b.id} className="ticket px-7 py-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="tracking-mark text-[0.62rem] text-brass">
                            {formatDateLabel(b.bookedOn).split(',')[0]}
                          </p>
                          <p className="font-display mt-1 text-2xl text-ink">
                            {formatDateLabel(b.bookedOn).split(',').slice(1).join(',').trim()}
                          </p>
                        </div>
                        <p className="font-display numerals text-4xl text-burgundy">
                          {b.slotTime}
                        </p>
                      </div>

                      <div className="ornament-rule my-5 text-xs">
                        <span aria-hidden="true">✦</span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-ink">{b.customerName}</span>
                          <span className="numerals text-xs text-ink-soft">{b.phone}</span>
                        </div>
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="phone" value={b.phone} />
                          <button
                            type="submit"
                            className="tracking-mark text-[0.7rem] text-burgundy underline-offset-4 hover:underline"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {results.past.length > 0 ? (
                <>
                  <p className="ornament-rule mt-12 text-xs tracking-mark">
                    <span>Previous visits</span>
                  </p>
                  <ul className="mt-5 divide-y divide-brass-pale/40 border-y border-brass-pale/40">
                    {results.past.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <span className="text-ink-soft">{formatDateLabel(b.bookedOn)}</span>
                        <span className="numerals text-ink-mid">{b.slotTime}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
