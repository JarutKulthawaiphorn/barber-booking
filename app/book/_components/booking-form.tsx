'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { NAME_MAX, NAME_MIN } from '@/lib/booking-domain';
import type { SlotStatus } from '@/lib/booking-domain';

import { useSlots } from '../../_hooks/use-slots';
import { createBookingAction } from '../actions';

type DayCell = { date: string; open: boolean };

type Props = {
  dayGrid: DayCell[];
  initialDate: string | null;
  initialSlots: SlotStatus[];
};

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function parseDateUTC(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatMonth(date: string): string {
  return parseDateUTC(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dayNumber(date: string): number {
  return parseDateUTC(date).getUTCDate();
}

function weekdayIndex(date: string): number {
  return parseDateUTC(date).getUTCDay();
}

function BookingSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary mt-2"
    >
      {pending ? 'Holding the chair...' : 'Confirm reservation'}
      <span aria-hidden="true">-&gt;</span>
    </button>
  );
}

export function BookingForm({ dayGrid, initialDate, initialSlots }: Props) {
  const [date, setDate] = useState<string>(initialDate ?? '');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Server pre-rendered the first day's slots — let the hook skip the
  // duplicate client fetch on mount, but re-fetch as soon as the user picks
  // any other day.
  const slotsState = useSlots(date || null, {
    initial: initialSlots,
    skipInitialFor: initialDate,
  });

  const bookableSet = useMemo(
    () => new Set(dayGrid.filter((c) => c.open).map((c) => c.date)),
    [dayGrid],
  );

  // Pad the grid so the first cell lands on its real weekday column.
  const paddedGrid = useMemo<(DayCell | null)[]>(() => {
    if (dayGrid.length === 0) return [];
    const pad = weekdayIndex(dayGrid[0].date);
    return [...Array.from({ length: pad }, () => null), ...dayGrid];
  }, [dayGrid]);

  function pickDate(next: string) {
    if (!bookableSet.has(next)) return;
    setDate(next);
    setSelectedSlot('');
  }

  if (bookableSet.size === 0) {
    return (
      <p className="banner-warn">
        No open chairs in the next two weeks. Please check back later.
      </p>
    );
  }

  const monthLabel = dayGrid.length > 0 ? formatMonth(dayGrid[0].date) : '';
  const slots = slotsState.list;
  const allTaken = slots.length > 0 && slots.every((s) => s.taken);

  return (
    <form action={createBookingAction} className="grid grid-cols-1 gap-7">
      <label>
        <span className="label-mark">Phone</span>
        <input
          type="tel"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          required
          placeholder="081 234 5678"
          pattern="[0-9\s-]*"
          maxLength={15}
          className="input-vintage numerals"
        />
        <span className="mt-1.5 block text-xs text-ink-faint">
          Thai mobile — 10 digits starting 06, 08 or 09.
        </span>
      </label>

      <label>
        <span className="label-mark">Name</span>
        <input
          type="text"
          name="customerName"
          autoComplete="name"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="Your name"
          className="input-vintage"
        />
        <span className="mt-1.5 block text-xs text-ink-faint">
          {NAME_MIN}–{NAME_MAX} characters.
        </span>
      </label>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label-mark">Date</span>
          <span className="text-xs text-ink-faint">{monthLabel}</span>
        </div>

        <input type="hidden" name="bookedOn" value={date} required />

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] tracking-mark text-ink-faint">
          {WEEKDAY_HEADERS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {paddedGrid.map((cell, i) => {
            if (!cell) return <span key={`pad-${i}`} aria-hidden="true" />;
            const isPicked = cell.date === date;
            const closed = !cell.open;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => pickDate(cell.date)}
                disabled={closed}
                aria-pressed={isPicked}
                aria-disabled={closed}
                aria-label={cell.date}
                className={[
                  'numerals h-10 rounded-sm border text-sm transition-colors',
                  closed
                    ? 'cursor-not-allowed border-brass-pale/30 bg-paper-warm/50 text-ink-faint/50 line-through'
                    : isPicked
                      ? 'border-ink bg-ink text-paper shadow-sm'
                      : 'border-brass-pale/70 bg-paper-warm text-ink hover:border-burgundy hover:text-burgundy',
                ].join(' ')}
              >
                {dayNumber(cell.date)}
              </button>
            );
          })}
        </div>
        <span className="mt-2 block text-xs text-ink-faint">
          Closed days are greyed out.
        </span>
      </div>

      <div>
        <span className="label-mark">Time</span>
        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {!date ? (
          <p className="text-sm italic text-ink-faint">Pick a date first.</p>
        ) : slotsState.loading ? (
          <p className="text-sm italic text-ink-faint">Checking the chair…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm italic text-ink-faint">
            {slotsState.error ?? 'No openings on this day.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const isPicked = selectedSlot === s.time;
              return (
                <button
                  type="button"
                  key={s.time}
                  onClick={() => setSelectedSlot(s.time)}
                  disabled={s.taken}
                  aria-pressed={isPicked}
                  aria-disabled={s.taken}
                  className={[
                    'numerals rounded-sm border px-2 py-2.5 text-sm transition-all',
                    s.taken
                      ? 'cursor-not-allowed border-brass-pale/30 bg-paper-warm/50 text-ink-faint/60 line-through'
                      : isPicked
                        ? 'border-ink bg-ink text-paper shadow-sm'
                        : 'border-brass-pale/70 bg-paper-warm text-ink hover:border-burgundy hover:text-burgundy',
                  ].join(' ')}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}
        {allTaken ? (
          <p className="mt-2 text-xs text-burgundy">
            Every slot is taken on this day.
          </p>
        ) : null}
        {slotsState.error && slots.length === 0 ? (
          <p className="mt-2 text-xs text-burgundy">{slotsState.error}</p>
        ) : null}
      </div>

      <BookingSubmitButton disabled={!date || !selectedSlot} />
    </form>
  );
}
