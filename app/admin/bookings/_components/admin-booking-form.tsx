'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import { NAME_MAX, NAME_MIN, type SlotStatus } from '@/lib/booking-domain';

import { useSlots } from '../../../_hooks/use-slots';
import { adminCreateBookingAction } from '../actions';

type Props = {
  bookableDates: string[];
  initialDate: string;
  initialSlots: SlotStatus[];
};

function AdminBookingSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary"
    >
      {pending ? 'Saving...' : 'Add booking'}
    </button>
  );
}

export function AdminBookingForm({ bookableDates, initialDate, initialSlots }: Props) {
  const [date, setDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState('');

  const slotsState = useSlots(date || null, {
    initial: initialSlots,
    skipInitialFor: initialDate,
  });

  if (bookableDates.length === 0) {
    return (
      <p className="banner-warn">
        No open days in the next two weeks. Adjust shop hours to book ahead.
      </p>
    );
  }

  return (
    <form action={adminCreateBookingAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <label>
        <span className="label-mark">Customer phone</span>
        <input
          type="tel"
          name="phone"
          inputMode="numeric"
          required
          placeholder="081 234 5678"
          pattern="[0-9\s-]*"
          maxLength={15}
          className="input-vintage numerals"
        />
      </label>

      <label>
        <span className="label-mark">Customer name</span>
        <input
          type="text"
          name="customerName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="Walk-in name"
          className="input-vintage"
        />
      </label>

      <label>
        <span className="label-mark">Barber</span>
        <input
          type="text"
          name="barberName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="Barber on the chair"
          className="input-vintage"
        />
      </label>

      <label>
        <span className="label-mark">Date</span>
        <select
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedSlot('');
          }}
          className="input-vintage"
        >
          {bookableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2">
        <span className="label-mark">Time</span>
        <input type="hidden" name="bookedOn" value={date} required />
        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {slotsState.loading ? (
          <p className="text-sm italic text-ink-faint">Loading slots…</p>
        ) : slotsState.list.length === 0 ? (
          <p className="text-sm italic text-ink-faint">
            {slotsState.error ?? 'No slots for this day.'}
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slotsState.list.map((s) => {
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
                    'numerals rounded-sm border px-2 py-2 text-sm transition-colors',
                    s.taken
                      ? 'cursor-not-allowed border-brass-pale/30 bg-paper-warm/50 text-ink-faint/60 line-through'
                      : isPicked
                        ? 'border-ink bg-ink text-paper'
                        : 'border-brass-pale/70 bg-paper-warm text-ink hover:border-burgundy hover:text-burgundy',
                  ].join(' ')}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <AdminBookingSubmitButton disabled={!date || !selectedSlot} />
      </div>
    </form>
  );
}
