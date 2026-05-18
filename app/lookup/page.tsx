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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-2 pb-10 sm:px-6">
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
        <h1 className="text-[17px] font-semibold">Your bookings</h1>
      </header>

      {params.error ? (
        <p className="banner banner-error mt-4" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? <p className="banner banner-ok mt-4">{params.ok}</p> : null}

      <section className="mt-4 flex flex-col gap-3">
        <form action={lookupBookingsAction} className="flex flex-col gap-3">
          <div className="field">
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <div className="input-prefix">
              <span className="prefix">+66</span>
              <input
                id="phone"
                type="tel"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                required
                defaultValue={phone ?? ''}
                placeholder="81 234 5678"
                pattern="[0-9\s-]*"
                maxLength={15}
                className="input tnum"
              />
            </div>
            <span className="hint">Thai mobile starting 06, 08 or 09.</span>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Look up
          </button>
        </form>
      </section>

      {results ? (
        <section className="mt-6 flex flex-col gap-5">
          {results.lookupError ? (
            <p className="banner banner-error" role="alert">
              {results.lookupError}
            </p>
          ) : results.upcoming.length === 0 && results.past.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {results.upcoming.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h2
                    className="text-[13px] font-semibold uppercase"
                    style={{
                      color: 'var(--color-muted)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Upcoming
                  </h2>
                  {results.upcoming.map((b) => (
                    <UpcomingBookingCard
                      key={b.id}
                      id={b.id}
                      slotTime={b.slotTime}
                      bookedOn={b.bookedOn}
                      customerName={b.customerName}
                      phone={b.phone}
                      barberName={b.barberName}
                    />
                  ))}
                </div>
              )}

              {results.past.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h2
                    className="text-[13px] font-semibold uppercase"
                    style={{
                      color: 'var(--color-muted)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Past
                  </h2>
                  <div
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    {results.past.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-1 py-3"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      >
                        <div>
                          <div className="text-[15px] font-medium tnum">
                            {formatDateLabel(b.bookedOn)} · {b.slotTime}
                          </div>
                          <div
                            className="mt-0.5 text-[12px]"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {b.barberName ? `with ${b.barberName}` : '30 min'}
                          </div>
                        </div>
                        <span className="badge badge-completed">
                          <span className="badge-dot" />
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="card card-pad flex flex-col items-center gap-2 text-center">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: 'var(--color-sunken)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3 9h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-[15px] font-semibold">No bookings yet</div>
      <div className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
        When this number books a chair it will show here.
      </div>
      <Link href="/book" className="btn btn-secondary btn-sm mt-1">
        Book a chair
      </Link>
    </div>
  );
}

function UpcomingBookingCard({
  id,
  slotTime,
  bookedOn,
  customerName,
  phone,
  barberName,
}: {
  id: string;
  slotTime: string;
  bookedOn: string;
  customerName: string;
  phone: string;
  barberName: string | null;
}) {
  return (
    <div className="card card-pad flex flex-col gap-3.5">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-[18px] font-semibold tnum"
            style={{ letterSpacing: '-0.01em' }}
          >
            {formatDateLabel(bookedOn)} · {slotTime}
          </div>
          <div
            className="mt-0.5 text-[13px]"
            style={{ color: 'var(--color-muted)' }}
          >
            30 min{barberName ? ` · with ${barberName}` : ''}
          </div>
          <div
            className="mt-1 text-[13px] tnum"
            style={{ color: 'var(--color-muted)' }}
          >
            {customerName} · {phone}
          </div>
        </div>
        <span className="badge badge-confirmed">
          <span className="badge-dot" />
          Confirmed
        </span>
      </div>
      <div className="divider" />
      <form action={cancelBookingAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="phone" value={phone} />
        <button type="submit" className="btn btn-danger btn-sm btn-block">
          Cancel booking
        </button>
      </form>
    </div>
  );
}
