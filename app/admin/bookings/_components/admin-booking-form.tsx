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
      className="btn btn-primary"
    >
      {pending ? 'Saving…' : 'Add booking'}
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
      <p className="banner banner-warn">
        No open days in the next two weeks. Adjust shop hours to book ahead.
      </p>
    );
  }

  return (
    <form action={adminCreateBookingAction} className="card card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="field">
        <label className="label" htmlFor="ab-phone">
          Customer phone
        </label>
        <div className="input-prefix">
          <span className="prefix">+66</span>
          <input
            id="ab-phone"
            type="tel"
            name="phone"
            inputMode="numeric"
            required
            placeholder="81 234 5678"
            pattern="[0-9\s-]*"
            maxLength={15}
            className="input tnum"
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-name">
          Customer name
        </label>
        <input
          id="ab-name"
          type="text"
          name="customerName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="Walk-in name"
          className="input"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-barber">
          Barber
        </label>
        <input
          id="ab-barber"
          type="text"
          name="barberName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="Barber on the chair"
          className="input"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-date">
          Date
        </label>
        <select
          id="ab-date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedSlot('');
          }}
          className="select"
        >
          {bookableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <span className="label" style={{ display: 'block', marginBottom: 6 }}>
          Time
        </span>
        <input type="hidden" name="bookedOn" value={date} required />
        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {slotsState.loading ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            Loading slots…
          </p>
        ) : slotsState.list.length === 0 ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            {slotsState.error ?? 'No slots for this day.'}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slotsState.list.map((s) => (
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
      </div>

      <div className="sm:col-span-2">
        <AdminBookingSubmitButton disabled={!date || !selectedSlot} />
      </div>
    </form>
  );
}
