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

function parseDateUTC(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayNumber(date: string): number {
  return parseDateUTC(date).getUTCDate();
}

function weekdayShort(date: string): string {
  return parseDateUTC(date).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

function formatPickedDate(date: string): string {
  return parseDateUTC(date).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function BookingSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn btn-primary btn-block"
    >
      {pending ? 'Holding the chair…' : 'Confirm booking'}
      {!pending && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function BookingForm({ dayGrid, initialDate, initialSlots }: Props) {
  const [date, setDate] = useState<string>(initialDate ?? '');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const slotsState = useSlots(date || null, {
    initial: initialSlots,
    skipInitialFor: initialDate,
  });

  const bookableSet = useMemo(
    () => new Set(dayGrid.filter((c) => c.open).map((c) => c.date)),
    [dayGrid],
  );

  function pickDate(next: string) {
    if (!bookableSet.has(next)) return;
    setDate(next);
    setSelectedSlot('');
  }

  if (bookableSet.size === 0) {
    return (
      <p className="banner banner-warn mt-6">
        No open chairs in the next two weeks. Please check back later.
      </p>
    );
  }

  const slots = slotsState.list;
  const allTaken = slots.length > 0 && slots.every((s) => s.taken);

  return (
    <form
      action={createBookingAction}
      className="mt-4 flex flex-1 flex-col gap-5 pb-4"
    >
      {/* Pick a date */}
      <section>
        <h2 className="text-[22px] font-semibold">Pick a date</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
          Asia/Bangkok · GMT+7
        </p>

        <input type="hidden" name="bookedOn" value={date} required />

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          style={{
            marginLeft: -16,
            marginRight: -16,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {dayGrid.map((cell) => {
            const isPicked = cell.date === date;
            const closed = !cell.open;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => pickDate(cell.date)}
                disabled={closed}
                aria-pressed={isPicked}
                aria-label={cell.date}
                className="date-chip"
              >
                <span className="wd">{weekdayShort(cell.date)}</span>
                <span className="d">{dayNumber(cell.date)}</span>
                {closed && (
                  <span
                    style={{ fontSize: 10, color: 'var(--color-faint)' }}
                  >
                    closed
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Pick a time */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[22px] font-semibold">Pick a time</h2>
          {date && (
            <span className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
              {formatPickedDate(date)}
            </span>
          )}
        </div>

        <div
          className="flex gap-3.5 text-[12px]"
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="flex items-center gap-1.5">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-2)',
              }}
            />
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--color-sunken)',
                border: '1px solid var(--color-border)',
              }}
            />
            Taken
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--color-accent)',
              }}
            />
            Selected
          </span>
        </div>

        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {!date ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            Pick a date first.
          </p>
        ) : slotsState.loading ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            Checking the chair…
          </p>
        ) : slots.length === 0 ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            {slotsState.error ?? 'No openings on this day.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => (
              <button
                type="button"
                key={s.time}
                onClick={() => setSelectedSlot(s.time)}
                disabled={s.taken}
                aria-pressed={selectedSlot === s.time}
                className="slot"
              >
                {s.time}
              </button>
            ))}
          </div>
        )}

        {allTaken ? (
          <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
            Every slot is taken on this day.
          </p>
        ) : null}
        {slotsState.error && slots.length === 0 ? (
          <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
            {slotsState.error}
          </p>
        ) : null}
      </section>

      {/* Customer details */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold">Your details</h2>

        <div className="field">
          <label className="label" htmlFor="customerName">
            Name
          </label>
          <input
            id="customerName"
            type="text"
            name="customerName"
            autoComplete="name"
            required
            minLength={NAME_MIN}
            maxLength={NAME_MAX}
            placeholder="Your name"
            className="input"
          />
          <span className="hint">
            {NAME_MIN}–{NAME_MAX} characters.
          </span>
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <div className="input-prefix">
            <span className="prefix">+66</span>
            <input
              id="phone"
              type="tel"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder="81 234 5678"
              pattern="[0-9\s-]*"
              maxLength={15}
              className="input tnum"
            />
          </div>
          <span className="hint">
            Thai mobile starting 06, 08 or 09.
          </span>
        </div>
      </section>

      {/* Summary + submit */}
      <div
        className="sticky bottom-0 mt-2 flex flex-col gap-2.5 pt-3"
        style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {date && selectedSlot ? (
          <div className="flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--color-muted)' }}>Selected</span>
            <span className="font-semibold tnum">
              {formatPickedDate(date)} · {selectedSlot}
            </span>
          </div>
        ) : null}
        <BookingSubmitButton disabled={!date || !selectedSlot} />
      </div>
    </form>
  );
}
