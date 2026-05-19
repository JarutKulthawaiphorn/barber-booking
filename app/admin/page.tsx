import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

import { AdminHeader } from './_components/admin-header';
import {
  addClosedDateAction,
  removeClosedDateAction,
  updateSettingsAction,
} from './actions';

export const metadata: Metadata = {
  title: 'พนักงาน · ตั้งค่าร้าน',
  robots: { index: false, follow: false },
};

const WEEKDAY_NAMES = [
  'อาทิตย์',
  'จันทร์',
  'อังคาร',
  'พุธ',
  'พฤหัสบดี',
  'ศุกร์',
  'เสาร์',
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const username = await requireAdmin();

  const today = todayInBangkok();
  const [settings, closedDates, params] = await Promise.all([
    getShopSettings(),
    listClosedDates({ from: today }),
    searchParams,
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <AdminHeader username={username} active="settings" />

      {params.error ? (
        <p className="banner banner-error mt-4" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? <p className="banner banner-ok mt-4">บันทึกแล้ว</p> : null}

      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[20px] font-semibold">เวลาเปิด-ปิดร้าน</h2>
          <span className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
            Asia / Bangkok
          </span>
        </div>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--color-muted)' }}>
          ใช้กับทุกวันที่เปิดทำการ
        </p>

        <form
          action={updateSettingsAction}
          className="card card-pad mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="field">
            <label className="label" htmlFor="openTime">
              เวลาเปิด
            </label>
            <input
              id="openTime"
              type="time"
              name="openTime"
              defaultValue={settings.openTime}
              required
              className="input tnum"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="closeTime">
              เวลาปิด
            </label>
            <input
              id="closeTime"
              type="time"
              name="closeTime"
              defaultValue={settings.closeTime}
              required
              className="input tnum"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="weeklyClosedWeekday">
              ปิดประจำทุก
            </label>
            <select
              id="weeklyClosedWeekday"
              name="weeklyClosedWeekday"
              defaultValue={settings.weeklyClosedWeekday ?? -1}
              className="select"
            >
              <option value={-1}>เปิดทุกวัน</option>
              {WEEKDAY_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  วัน{name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn btn-primary">
              บันทึกเวลาเปิด-ปิด
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[20px] font-semibold">วันที่ปิด</h2>
          <span className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
            {closedDates.length} รายการ
          </span>
        </div>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--color-muted)' }}>
          วันปิดเพิ่มเติมนอกเหนือจากวันปิดประจำสัปดาห์ (ไม่แสดงวันที่ผ่านไปแล้ว)
        </p>

        <div className="card mt-4 overflow-hidden">
          {closedDates.length === 0 ? (
            <p
              className="px-4 py-5 text-[14px]"
              style={{ color: 'var(--color-muted)' }}
            >
              ยังไม่มีวันที่ปิด
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {closedDates.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="tnum font-medium">{d.closedOn}</span>
                    {d.note ? (
                      <span style={{ color: 'var(--color-muted)' }}>
                        {d.note}
                      </span>
                    ) : null}
                  </div>
                  <form action={removeClosedDateAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      ลบ
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          action={addClosedDateAction}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
        >
          <div className="field">
            <label className="label" htmlFor="closedOn">
              วันที่
            </label>
            <input
              id="closedOn"
              type="date"
              name="closedOn"
              min={today}
              required
              className="input tnum"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="note">
              หมายเหตุ (ถ้ามี)
            </label>
            <input
              id="note"
              type="text"
              name="note"
              maxLength={120}
              placeholder="เช่น วันหยุดนักขัตฤกษ์"
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            เพิ่มวันปิด
          </button>
        </form>
      </section>
    </main>
  );
}
