import { requireAdmin } from '@/lib/auth';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

import { AdminHeader } from './_components/admin-header';
import {
  addClosedDateAction,
  removeClosedDateAction,
  updateSettingsAction,
} from './actions';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
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
    <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14">
      <AdminHeader username={username} active="settings" />

      {params.error ? (
        <p className="reveal reveal-d2 banner-error mt-8" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.ok ? (
        <p className="reveal reveal-d2 banner-ok mt-8">Saved.</p>
      ) : null}

      <section className="reveal reveal-d2 mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">Shop hours</h2>
          <p className="tracking-mark text-[0.65rem] text-brass">Asia / Bangkok</p>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Applied to every open day.
        </p>

        <form
          action={updateSettingsAction}
          className="corner-brackets card-paper mt-6 grid grid-cols-1 gap-5 p-7 sm:grid-cols-3 sm:p-8"
        >
          <label>
            <span className="label-mark">Open time</span>
            <input
              type="time"
              name="openTime"
              defaultValue={settings.openTime}
              required
              className="input-vintage numerals"
            />
          </label>
          <label>
            <span className="label-mark">Close time</span>
            <input
              type="time"
              name="closeTime"
              defaultValue={settings.closeTime}
              required
              className="input-vintage numerals"
            />
          </label>
          <label>
            <span className="label-mark">Closed every</span>
            <select
              name="weeklyClosedWeekday"
              defaultValue={settings.weeklyClosedWeekday}
              className="input-vintage"
            >
              {WEEKDAY_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary">
              Save shop hours
            </button>
          </div>
        </form>
      </section>

      <section className="reveal reveal-d3 mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">Closed dates</h2>
          <p className="tracking-mark text-[0.65rem] text-brass">{closedDates.length} listed</p>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          One-off closures on top of the weekly closed day. Past dates are hidden.
        </p>

        <ul className="mt-6 divide-y divide-brass-pale/40 border-y border-brass-pale/40">
          {closedDates.length === 0 ? (
            <li className="px-1 py-4 text-sm italic text-ink-faint">No closed dates yet.</li>
          ) : (
            closedDates.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 py-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display numerals text-lg text-ink">{d.closedOn}</span>
                  {d.note ? (
                    <span className="italic text-ink-soft">— {d.note}</span>
                  ) : null}
                </div>
                <form action={removeClosedDateAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="tracking-mark text-[0.7rem] text-burgundy underline-offset-4 hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form
          action={addClosedDateAction}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
        >
          <label>
            <span className="label-mark">Date</span>
            <input
              type="date"
              name="closedOn"
              min={today}
              required
              className="input-vintage numerals"
            />
          </label>
          <label>
            <span className="label-mark">Note (optional)</span>
            <input
              type="text"
              name="note"
              maxLength={120}
              placeholder="e.g. Public holiday"
              className="input-vintage"
            />
          </label>
          <button type="submit" className="btn-ghost">
            Add closure
          </button>
        </form>
      </section>
    </main>
  );
}
