'use client';

import { useEffect, useState, useTransition } from 'react';

import { createBookingAction } from '../actions';

type Props = {
  bookableDates: string[];
  initialDate: string | null;
  initialSlots: string[];
};

type SlotsState = {
  loading: boolean;
  list: string[];
  error: string | null;
};

const inputClass =
  'mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

const primaryButtonClass =
  'rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200';

function formatDateLabel(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function BookingForm({ bookableDates, initialDate, initialSlots }: Props) {
  const [date, setDate] = useState<string>(initialDate ?? '');
  const [slotsState, setSlotsState] = useState<SlotsState>({
    loading: false,
    list: initialSlots,
    error: null,
  });
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (date === initialDate || !date) return;

    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(`/api/slots?date=${encodeURIComponent(date)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Could not load slots');
        const body = (await res.json()) as { slots: string[] };
        setSlotsState({ loading: false, list: body.slots, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setSlotsState({
          loading: false,
          list: [],
          error: err instanceof Error ? err.message : 'Could not load slots',
        });
      }
    })();

    return () => controller.abort();
  }, [date, initialDate]);

  if (bookableDates.length === 0) {
    return (
      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        No open days in the next two weeks. Please check back later.
      </p>
    );
  }

  const { list: slots, error: slotsError } = slotsState;

  return (
    <form
      action={(formData) => startSubmit(() => createBookingAction(formData))}
      className="grid grid-cols-1 gap-4"
    >
      <label className="text-sm">
        <span className="block font-medium text-zinc-700 dark:text-zinc-300">Phone</span>
        <input
          type="tel"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          required
          placeholder="0812345678"
          pattern="[0-9\s-]*"
          maxLength={15}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
          Thai mobile only — 10 digits starting with 06, 08, or 09.
        </span>
      </label>

      <label className="text-sm">
        <span className="block font-medium text-zinc-700 dark:text-zinc-300">Date</span>
        <select
          name="bookedOn"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        >
          {bookableDates.map((d) => (
            <option key={d} value={d}>
              {formatDateLabel(d)}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="block font-medium text-zinc-700 dark:text-zinc-300">Time</span>
        <select
          name="slotTime"
          required
          disabled={slots.length === 0}
          defaultValue=""
          className={inputClass}
          key={`${date}-${slots.join(',')}`}
        >
          <option value="" disabled>
            {slots.length === 0 ? 'No slots available' : 'Pick a time'}
          </option>
          {slots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {slotsError ? (
          <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{slotsError}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={submitting || slots.length === 0}
        className={primaryButtonClass}
      >
        {submitting ? 'Booking…' : 'Book appointment'}
      </button>
    </form>
  );
}
