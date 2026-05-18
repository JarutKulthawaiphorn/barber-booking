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

export function BookingForm({ bookableDates, initialDate, initialSlots }: Props) {
  const [date, setDate] = useState<string>(initialDate ?? '');
  const [slotsState, setSlotsState] = useState<SlotsState>({
    loading: false,
    list: initialSlots,
    error: null,
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [submitting, startSubmit] = useTransition();

  const isClosedDate = date !== '' && !bookableDates.includes(date);

  function handleDateChange(next: string) {
    setDate(next);
    setSelectedSlot('');
    if (next && next !== initialDate && bookableDates.includes(next)) {
      setSlotsState({ loading: true, list: [], error: null });
    }
  }

  useEffect(() => {
    if (date === initialDate || !date) return;
    if (!bookableDates.includes(date)) return;

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
  }, [date, initialDate, bookableDates]);

  if (bookableDates.length === 0) {
    return (
      <p className="banner-warn">
        No open chairs in the next two weeks. Please check back later.
      </p>
    );
  }

  const slotsError = slotsState.error;
  const slots = isClosedDate ? [] : slotsState.list;

  return (
    <form
      action={(formData) => startSubmit(() => createBookingAction(formData))}
      className="grid grid-cols-1 gap-7"
    >
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
        <span className="label-mark">Date</span>
        <input
          type="date"
          name="bookedOn"
          required
          value={date}
          min={bookableDates[0]}
          max={bookableDates[bookableDates.length - 1]}
          onChange={(e) => handleDateChange(e.target.value)}
          className="input-vintage numerals"
        />
        {isClosedDate ? (
          <span className="mt-1.5 block text-xs text-brass">
            Shop is closed on this date.
          </span>
        ) : null}
      </label>

      <div>
        <span className="label-mark">Time</span>
        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {slotsState.loading ? (
          <p className="text-sm italic text-ink-faint">Checking the chair…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm italic text-ink-faint">
            {isClosedDate ? 'Closed' : slotsError ?? 'No openings on this day.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const isPicked = selectedSlot === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSelectedSlot(s)}
                  className={[
                    'numerals rounded-sm border px-2 py-2.5 text-sm transition-all',
                    isPicked
                      ? 'border-ink bg-ink text-paper shadow-sm'
                      : 'border-brass-pale/70 bg-paper-warm text-ink hover:border-burgundy hover:text-burgundy',
                  ].join(' ')}
                  aria-pressed={isPicked}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
        {slotsError && slots.length === 0 ? (
          <p className="mt-2 text-xs text-burgundy">{slotsError}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting || slots.length === 0 || !selectedSlot}
        className="btn-primary mt-2"
      >
        {submitting ? 'Holding the chair…' : 'Confirm reservation'}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
