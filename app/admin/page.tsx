import { requireAdmin } from '@/lib/auth';
import { getShopSettings, listClosedDates } from '@/lib/shop-settings';
import { todayInBangkok } from '@/lib/timezone';

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

const inputClass =
  'mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

const primaryButtonClass =
  'rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200';

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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Shop admin</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
          </p>
        </div>
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Log out
          </button>
        </form>
      </header>

      {params.error ? (
        <p
          className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {params.error}
        </p>
      ) : null}
      {params.ok ? (
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Saved.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Shop hours</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Applied to every open day. All times are in Asia/Bangkok.
        </p>
        <form
          action={updateSettingsAction}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">Open time</span>
            <input
              type="time"
              name="openTime"
              defaultValue={settings.openTime}
              required
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">Close time</span>
            <input
              type="time"
              name="closeTime"
              defaultValue={settings.closeTime}
              required
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">
              Closed every
            </span>
            <select
              name="weeklyClosedWeekday"
              defaultValue={settings.weeklyClosedWeekday}
              className={inputClass}
            >
              {WEEKDAY_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <button type="submit" className={primaryButtonClass}>
              Save shop hours
            </button>
          </div>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Closed dates</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          One-off closures on top of the weekly closed day. Past dates are hidden.
        </p>

        <ul className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {closedDates.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              No closed dates yet.
            </li>
          ) : (
            closedDates.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{d.closedOn}</span>
                  {d.note ? (
                    <span className="ml-2 text-zinc-500 dark:text-zinc-400">— {d.note}</span>
                  ) : null}
                </div>
                <form action={removeClosedDateAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={addClosedDateAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">Date</span>
            <input
              type="date"
              name="closedOn"
              min={today}
              required
              className={inputClass}
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="block font-medium text-zinc-700 dark:text-zinc-300">
              Note (optional)
            </span>
            <input
              type="text"
              name="note"
              maxLength={120}
              placeholder="e.g. Public holiday"
              className={inputClass}
            />
          </label>
          <button type="submit" className={primaryButtonClass}>
            Add closed date
          </button>
        </form>
      </section>
    </main>
  );
}
