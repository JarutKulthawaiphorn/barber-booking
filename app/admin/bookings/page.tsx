import { requireAdmin } from '@/lib/auth';
import { listBookingsOnDate } from '@/lib/booking';
import { todayInBangkok } from '@/lib/timezone';

import { AdminHeader } from '../_components/admin-header';
import { BookingRow } from './_components/booking-row';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; ok?: string }>;
}) {
  const username = await requireAdmin();
  const params = await searchParams;
  const today = todayInBangkok();
  const date = params.date && DATE_RE.test(params.date) ? params.date : today;
  const label = formatDateLabel(date);

  const bookings = await listBookingsOnDate(date);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14">
      <AdminHeader username={username} active="bookings" />

      {params.error ? (
        <p className="reveal reveal-d2 banner-error mt-8" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? (
        <p className="reveal reveal-d2 banner-ok mt-8">{params.ok}</p>
      ) : null}

      {/* Date masthead */}
      <section className="reveal reveal-d2 mt-12 grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <div>
          <p className="tracking-mark text-[0.65rem] text-brass">{label.weekday}</p>
          <p className="font-display numerals flex items-baseline gap-3 text-ink">
            <span className="text-7xl leading-none">{label.day}</span>
            <span className="flex flex-col items-start text-left">
              <span className="text-2xl">{label.month}</span>
              <span className="text-base text-ink-soft">{label.year}</span>
            </span>
          </p>
        </div>

        <form
          method="get"
          className="flex items-end gap-3 justify-self-start sm:justify-self-end"
        >
          <label>
            <span className="label-mark">Jump to</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              required
              className="input-vintage numerals"
            />
          </label>
          <button type="submit" className="btn-ghost">
            View
          </button>
        </form>
      </section>

      <section className="reveal reveal-d3 mt-10">
        <p className="ornament-rule text-xs tracking-mark">
          <span>
            {bookings.length === 0
              ? 'No bookings'
              : `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}`}
          </span>
        </p>

        {bookings.length > 0 ? (
          <ul className="mt-8 divide-y divide-brass-pale/40 border-y border-brass-pale/40">
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
        ) : (
          <p className="mt-8 text-center text-sm italic text-ink-faint">
            The chair is free all day.
          </p>
        )}
      </section>
    </main>
  );
}
