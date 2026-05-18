'use client';

import { type FormEvent } from 'react';

import { adminCancelBookingAction } from '../actions';

export function BookingRow({
  id,
  slotTime,
  phone,
  customerName,
  barberName,
  date,
}: {
  id: string;
  slotTime: string;
  phone: string;
  customerName: string;
  barberName: string | null;
  date: string;
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Cancel the ${slotTime} booking? This cannot be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="font-display numerals text-3xl text-burgundy">{slotTime}</span>
        <span className="text-base text-ink">{customerName}</span>
        <span className="numerals text-sm text-ink-soft">{phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</span>
        {barberName ? (
          <span className="rounded-sm border border-brass-pale/70 bg-paper-warm px-2 py-0.5 text-[0.7rem] tracking-mark text-brass">
            Barber · {barberName}
          </span>
        ) : null}
      </div>
      <form action={adminCancelBookingAction} onSubmit={handleSubmit}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="date" value={date} />
        <button
          type="submit"
          className="tracking-mark text-[0.7rem] text-burgundy underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </form>
    </li>
  );
}
