import Link from 'next/link';
import { Suspense } from 'react';

import { getShopSettings } from '@/lib/shop-settings';
import { THAI_WEEKDAY_NAMES } from '@/lib/thai-date';

function formatOpenDayRange(weeklyClosed: number | null): string {
  if (weeklyClosed === null) return 'ทุกวัน';
  const start = (weeklyClosed + 1) % 7;
  const end = (weeklyClosed + 6) % 7;
  return `${THAI_WEEKDAY_NAMES[start]} – ${THAI_WEEKDAY_NAMES[end]}`;
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
            {THAI_WEEKDAY_NAMES[settings.weeklyClosedWeekday]}
          </span>
          <span style={{ color: 'var(--color-muted)' }}>ปิด</span>
        </div>
      ) : null}
    </>
  );
}

function HoursTileFallback() {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[15px]">
      <span style={{ color: 'var(--color-faint)' }}>กำลังโหลดเวลาทำการ…</span>
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
          <span className="text-[15px] font-semibold">Barber Booking</span>
        </div>
        <Link
          href="/admin/login"
          className="text-[13px] no-underline"
          style={{ color: 'var(--color-muted)' }}
        >
          พนักงาน
        </Link>
      </header>

      <section className="mt-6 flex flex-col gap-5">
        <div>
          <h1
            className="text-[28px] font-semibold leading-[1.15]"
            style={{ letterSpacing: '-0.02em' }}
          >
            จองคิวตัดผมที่
            <br />
            Barber Booking
          </h1>
          <p
            className="mt-2.5 max-w-[320px] text-[15px]"
            style={{ color: 'var(--color-ink-2)' }}
          >
            หนึ่งร้าน สองช่าง คิวละ 30 นาที รับ walk-in เมื่อมีคิวว่าง
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link href="/book" className="btn btn-primary btn-block">
            จองคิว
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
            ค้นหาการจองของคุณ
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
              เวลาทำการ
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
            บริการ
          </h2>
          <div className="flex flex-col gap-2 text-[15px]">
            <div className="flex items-baseline justify-between">
              <span>ตัดผม</span>
              <span style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span className="tnum text-[13px]" style={{ color: 'var(--color-muted)' }}>
                  30 นาที
                </span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
            ราคาเดียวต่อคิว — ชำระเงินสดในวันที่มาใช้บริการ
          </p>
        </div>

        <div
          className="text-[13px] leading-[1.55]"
          style={{ color: 'var(--color-muted)' }}
        >
          รับจองผ่านเบอร์มือถือไทยเท่านั้น (ขึ้นต้นด้วย 06, 08 หรือ 09)
          <br />
          Walk-in หลัง 18:00 หากมีคิวว่าง
        </div>
      </section>
    </main>
  );
}
