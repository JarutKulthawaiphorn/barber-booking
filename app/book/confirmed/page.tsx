import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getBookingById } from '@/lib/booking';
import { formatShortDateWithYear } from '@/lib/thai-date';

export const dynamic = 'force-dynamic';

const getCachedBookingById = cache(getBookingById);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  const booking = id ? await getCachedBookingById(id).catch(() => null) : null;
  const title = booking
    ? `การจอง · ${booking.slotTime} ${booking.bookedOn}`
    : 'การจอง';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const booking = await getCachedBookingById(id);
  if (!booking) notFound();

  const ref = booking.id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-8 pb-10 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--color-accent-3)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12l5 5 9-11"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-[24px] font-semibold">จองคิวสำเร็จ</h1>
        <p className="text-[14px]" style={{ color: 'var(--color-muted)' }}>
          เราได้เก็บคิวให้คุณเรียบร้อย กรุณาเก็บเบอร์โทรไว้สำหรับค้นหาการจองภายหลัง
        </p>
      </div>

      <section className="card card-pad mt-7 flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-semibold uppercase"
            style={{ color: 'var(--color-muted)', letterSpacing: '0.06em' }}
          >
            การจอง
          </span>
          <span className="badge badge-confirmed">
            <span className="badge-dot" />
            ยืนยันแล้ว
          </span>
        </div>

        <div>
          <div className="text-[22px] font-semibold tnum" style={{ letterSpacing: '-0.01em' }}>
            {formatShortDateWithYear(booking.bookedOn)} · {booking.slotTime}
          </div>
          <div className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
            30 นาที · Asia / Bangkok
          </div>
        </div>

        <div className="divider" />

        <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-[14px]">
          <dt style={{ color: 'var(--color-muted)' }}>ชื่อ</dt>
          <dd className="text-right font-medium">{booking.customerName}</dd>
          <dt style={{ color: 'var(--color-muted)' }}>เบอร์โทร</dt>
          <dd className="text-right font-medium tnum">{booking.phone}</dd>
          <dt style={{ color: 'var(--color-muted)' }}>อ้างอิง</dt>
          <dd className="text-right font-medium mono text-[13px]">#{ref}</dd>
        </dl>
      </section>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link href="/lookup" className="btn btn-secondary btn-block">
          ดูการจองของฉัน
        </Link>
        <Link href="/" className="btn btn-ghost btn-block">
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
