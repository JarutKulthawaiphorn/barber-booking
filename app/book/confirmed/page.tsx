import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingById } from '@/lib/booking';

function maskPhone(phone: string): string {
  // 0812345678 → 081-XXX-5678
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-XXX-${phone.slice(6)}`;
}

function formatDateLabel(yyyyMmDd: string): {
  weekday: string;
  day: string;
  month: string;
  year: string;
} {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
    day: dt.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' }),
    month: dt.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
    year: dt.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'UTC' }),
  };
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

  const date = formatDateLabel(booking.bookedOn);
  const ref = booking.id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-14 sm:py-20">
      <p className="reveal reveal-d1 tracking-mark text-center text-xs text-brass">
        № 03 — Reservation confirmed
      </p>

      <h1 className="reveal reveal-d2 font-display mt-4 text-center text-4xl text-ink sm:text-5xl">
        Your chair is <em className="font-display italic text-burgundy not-italic">held.</em>
      </h1>

      {/* Ticket stub */}
      <article className="reveal reveal-d3 ticket mt-12 px-8 py-9 sm:px-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tracking-mark text-[0.62rem] text-ink-faint">Reservation</p>
            <p className="font-display numerals mt-1 text-xl text-ink">#{ref}</p>
          </div>
          <div className="text-right">
            <p className="tracking-mark text-[0.62rem] text-ink-faint">The Bangkok Barber</p>
            <p className="font-display mt-1 text-sm italic text-ink-soft">est. MMXXVI</p>
          </div>
        </div>

        <div className="ornament-rule my-8 text-xs">
          <span aria-hidden="true">✦</span>
        </div>

        <div className="text-center">
          <p className="tracking-mark text-[0.62rem] text-brass">{date.weekday}</p>
          <p className="font-display numerals mt-2 flex items-baseline justify-center gap-3 text-ink">
            <span className="text-7xl leading-none">{date.day}</span>
            <span className="flex flex-col items-start text-left">
              <span className="text-2xl">{date.month}</span>
              <span className="numerals text-base text-ink-soft">{date.year}</span>
            </span>
          </p>

          <p className="font-display numerals mt-8 text-5xl text-burgundy">
            {booking.slotTime}
          </p>
          <p className="tracking-mark mt-1 text-[0.62rem] text-ink-faint">
            Asia / Bangkok
          </p>
        </div>

        <div className="ornament-rule my-8 text-xs">
          <span aria-hidden="true">✦</span>
        </div>

        <dl className="flex items-center justify-between text-sm">
          <dt className="tracking-mark text-[0.62rem] text-ink-faint">Phone</dt>
          <dd className="numerals font-medium text-ink">{maskPhone(booking.phone)}</dd>
        </dl>
      </article>

      <p className="mt-8 text-center text-sm italic text-ink-soft">
        Keep your phone number — that&apos;s how you&apos;ll find this booking again.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
        <Link href="/book" className="btn-ghost">
          Book another
        </Link>
        <Link href="/" className="btn-link">
          Back to home
        </Link>
      </div>
    </main>
  );
}
