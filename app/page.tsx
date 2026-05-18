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

/**
 * Render the open-day range as e.g. "Tuesday through Sunday" when one weekday
 * is closed, or "Every day" when the shop never closes weekly.
 */
function formatOpenDayRange(weeklyClosed: number | null): string {
  if (weeklyClosed === null) return 'Every day';
  const start = (weeklyClosed + 1) % 7;
  const end = (weeklyClosed + 6) % 7;
  return `${WEEKDAY_NAMES[start]} through ${WEEKDAY_NAMES[end]}`;
}

/**
 * Async island for the dynamic "Hours" tile. Hoisted into its own component so
 * the rest of the home page renders from the static shell immediately and this
 * block streams in once `getShopSettings()` resolves from the tagged cache.
 *
 * Replaces the old `dynamic = 'force-dynamic'` on the whole page — only this
 * tile actually needs the data, and the cache means most loads serve from
 * memory anyway.
 */
async function HoursTile() {
  const settings = await getShopSettings();
  return (
    <>
      <p className="font-display mt-2 text-2xl text-ink numerals">
        {settings.openTime} — {settings.closeTime}
      </p>
      <p className="mt-1 text-sm text-ink-mid">
        {formatOpenDayRange(settings.weeklyClosedWeekday)}
      </p>
    </>
  );
}

function HoursTileFallback() {
  return (
    <>
      <p className="font-display mt-2 text-2xl text-ink-faint numerals">— : — — — : —</p>
      <p className="mt-1 text-sm text-ink-faint italic">Loading…</p>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:py-14">
      {/* Top marque */}
      <header className="reveal reveal-d1 flex items-center justify-between text-[0.72rem] tracking-mark text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rotate-45 bg-burgundy" />
          The Bangkok Barber
        </span>
        <span className="hidden sm:inline">Est. MMXXVI · Asia/Bangkok</span>
        <Link
          href="/admin/login"
          className="text-ink-faint hover:text-burgundy transition-colors"
        >
          Staff
        </Link>
      </header>

      {/* Hero */}
      <section className="relative mt-16 grid flex-1 grid-cols-12 gap-6 sm:mt-24">
        {/* Animated barber pole */}
        <div className="reveal reveal-d2 col-span-1 hidden sm:flex sm:items-stretch">
          <div className="barber-pole w-3 rounded-full sm:w-4" aria-hidden="true" />
        </div>

        <div className="col-span-12 sm:col-span-11">
          <p className="reveal reveal-d2 tracking-mark text-xs text-brass">
            № 01 — Reservations
          </p>

          <h1 className="reveal reveal-d3 font-display mt-4 text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] text-ink">
            The chair,
            <br />
            the clippers,
            <br />
            <em className="text-burgundy not-italic font-display italic">the cut.</em>
          </h1>

          <div className="reveal reveal-d4 mt-10 max-w-xl">
            <p className="text-base text-ink-soft sm:text-lg">
              Thirty-minute appointments, six days a week. Pick a chair, leave a number, and we&apos;ll
              hold the time.
            </p>
          </div>

          <div className="reveal reveal-d5 mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/book" className="btn-primary w-full sm:w-auto">
              Book a chair
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/lookup" className="btn-link">
              Find an existing booking
            </Link>
          </div>
        </div>
      </section>

      {/* Lower ornament strip */}
      <section className="reveal reveal-d6 mt-20 grid grid-cols-1 gap-8 border-t border-brass-pale/60 pt-10 sm:mt-28 sm:grid-cols-3">
        <div>
          <p className="tracking-mark text-[0.65rem] text-brass">Hours</p>
          <Suspense fallback={<HoursTileFallback />}>
            <HoursTile />
          </Suspense>
        </div>
        <div>
          <p className="tracking-mark text-[0.65rem] text-brass">Service</p>
          <p className="font-display mt-2 text-2xl text-ink">Thirty minutes</p>
          <p className="mt-1 text-sm text-ink-mid">Cut, shape, hot finish</p>
        </div>
        <div>
          <p className="tracking-mark text-[0.65rem] text-brass">Reach us</p>
          <p className="font-display mt-2 text-2xl text-ink">Phone only</p>
          <p className="mt-1 text-sm text-ink-mid">06 / 08 / 09 numbers</p>
        </div>
      </section>

      <footer className="mt-16 flex items-center justify-between text-[0.7rem] tracking-mark text-ink-faint">
        <span>One chair · one cut · one time</span>
        <span aria-hidden="true">✦</span>
      </footer>
    </main>
  );
}
