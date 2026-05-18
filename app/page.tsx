import Link from 'next/link';
import { Suspense } from 'react';

import { getShopSettings } from '@/lib/shop-settings';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function formatOpenDayRange(weeklyClosed: number | null): string {
  if (weeklyClosed === null) return 'Every day';
  const start = (weeklyClosed + 1) % 7;
  const end = (weeklyClosed + 6) % 7;
  return `${WEEKDAY_NAMES[start]} – ${WEEKDAY_NAMES[end]}`;
}

async function HoursTile() {
  const settings = await getShopSettings();
  return (
    <>
      <div className="flex items-baseline justify-between gap-3 text-[15px]">
        <span style={{ color: 'var(--color-ink-2)' }}>
          {formatOpenDayRange(settings.weeklyClosedWeekday)}
        </span>
        <span className="tnum">
          {settings.openTime} – {settings.closeTime}
        </span>
      </div>
      {settings.weeklyClosedWeekday !== null ? (
        <div className="flex items-baseline justify-between gap-3 text-[15px]">
          <span style={{ color: 'var(--color-ink-2)' }}>
            {WEEKDAY_NAMES[settings.weeklyClosedWeekday]}
          </span>
          <span style={{ color: 'var(--color-muted)' }}>Closed</span>
        </div>
      ) : null}
    </>
  );
}

function HoursTileFallback() {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[15px]">
      <span style={{ color: 'var(--color-faint)' }}>Loading hours…</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-4 pb-10 sm:px-6">
      {/* Top brand row */}
      <header className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-bg)',
              letterSpacing: '-0.02em',
            }}
          >
            B
          </div>
          <span className="text-[15px] font-semibold">Bangkok Barber</span>
        </div>
        <Link
          href="/admin/login"
          className="text-[13px] no-underline"
          style={{ color: 'var(--color-muted)' }}
        >
          Staff
        </Link>
      </header>

      <section className="mt-6 flex flex-col gap-5">
        <div>
          <h1
            className="text-[28px] font-semibold leading-[1.15]"
            style={{ letterSpacing: '-0.02em' }}
          >
            Book a chair at
            <br />
            The Bangkok Barber.
          </h1>
          <p
            className="mt-2.5 max-w-[320px] text-[15px]"
            style={{ color: 'var(--color-ink-2)' }}
          >
            One shop, two barbers. 30-minute slots, walk-ins welcome when a chair is free.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link href="/book" className="btn btn-primary btn-block">
            Book a chair
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link href="/lookup" className="btn btn-secondary btn-block">
            Find an existing booking
          </Link>
        </div>

        <div className="card card-pad flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-[12px] font-semibold uppercase"
              style={{
                color: 'var(--color-muted)',
                letterSpacing: '0.06em',
              }}
            >
              Hours
            </h2>
            <span className="badge badge-confirmed">
              <span className="badge-dot" />
              Asia / Bangkok
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Suspense fallback={<HoursTileFallback />}>
              <HoursTile />
            </Suspense>
          </div>
        </div>

        <div className="card card-pad flex flex-col gap-2.5">
          <h2
            className="text-[12px] font-semibold uppercase"
            style={{
              color: 'var(--color-muted)',
              letterSpacing: '0.06em',
            }}
          >
            Service
          </h2>
          <div className="flex flex-col gap-2 text-[15px]">
            <div className="flex items-baseline justify-between">
              <span>Haircut</span>
              <span style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span className="tnum text-[13px]" style={{ color: 'var(--color-muted)' }}>
                  30 min
                </span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
            One price covers the chair — pay in cash on the day.
          </p>
        </div>

        <div
          className="text-[13px] leading-[1.55]"
          style={{ color: 'var(--color-muted)' }}
        >
          Phone bookings only — Thai mobile numbers starting 06, 08 or 09.
          <br />
          Walk-ins after 18:00 if a chair is open.
        </div>
      </section>
    </main>
  );
}
