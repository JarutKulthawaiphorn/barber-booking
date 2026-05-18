import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth';
import { listBookableDates, listBookingsOnDate, slotsWithStatus } from '@/lib/booking';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

import { AdminHeader } from '../_components/admin-header';
import { AdminBookingForm } from './_components/admin-booking-form';
import { BookingRow } from './_components/booking-row';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const metadata: Metadata = {
  title: 'Admin · Schedule',
  robots: { index: false, follow: false },
};

function formatDateLabel(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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
  const label = formatDateLabel(date);
  const isToday = date === today;

  const [bookings, settings, closedDates] = await Promise.all([
    listBookingsOnDate(date),
    getShopSettings(),
    listClosedDates({ from: today }),
  ]);
  const bookableDates = listBookableDates({ settings, closedDates, today });
  const initialBookingDate = bookableDates.includes(date)
    ? date
    : (bookableDates[0] ?? '');
  const initialSlotBookings =
    initialBookingDate && initialBookingDate !== date
      ? await listBookingsOnDate(initialBookingDate)
      : bookings;
  const initialSlots = initialBookingDate
    ? slotsWithStatus({
        settings,
        closedDates,
        existingBookings: initialSlotBookings,
        date: initialBookingDate,
        today,
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <AdminHeader username={username} active="bookings" />

      {params.error ? (
        <p className="banner banner-error mt-4" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? <p className="banner banner-ok mt-4">{params.ok}</p> : null}

      {/* Date masthead */}
      <section className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold">
            {isToday ? 'Today' : 'Schedule'}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
            {label} · Asia/Bangkok
          </p>
        </div>

        <form method="get" className="flex items-end gap-2">
          <div className="field">
            <label
              className="label"
              htmlFor="date"
              style={{ fontSize: 12 }}
            >
              Jump to date
            </label>
            <input
              id="date"
              type="date"
              name="date"
              defaultValue={date}
              required
              className="input tnum"
              style={{ width: 180 }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            View
          </button>
        </form>
      </section>

      {/* Schedule table */}
      <section className="mt-5">
        <div className="card overflow-hidden">
          <div
            className="hidden sm:grid"
            style={{
              gridTemplateColumns: '110px 1fr 180px 140px 80px',
              padding: '10px 16px',
              background: 'var(--color-sunken)',
              fontSize: 12,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>Time</span>
            <span>Customer</span>
            <span>Phone</span>
            <span>Barber</span>
            <span />
          </div>

          {bookings.length > 0 ? (
            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {bookings.map((b) => (
                <BookingRow
                  key={b.id}
                  id={b.id}
                  slotTime={b.slotTime}
                  phone={b.phone}
                  customerName={b.customerName}
                  barberName={b.barberName}
                  date={date}
                />
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <div className="text-[14px] font-medium">
                No bookings on this day
              </div>
              <div
                className="mt-1 text-[13px]"
                style={{ color: 'var(--color-muted)' }}
              >
                Add a walk-in or phone booking below.
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[18px] font-semibold">Add booking</h2>
          <span className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
            Walk-in or phone
          </span>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
          The barber name will appear on the booking card.
        </p>
        <div className="mt-4">
          <AdminBookingForm
            bookableDates={bookableDates}
            initialDate={initialBookingDate}
            initialSlots={initialSlots}
          />
        </div>
      </section>
    </main>
  );
}
