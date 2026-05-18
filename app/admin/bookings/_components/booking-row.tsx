'use client';

import { useState, type FormEvent } from 'react';

import { adminCancelBookingAction } from '../actions';

function maskPhone(phone: string): string {
  // 0812345678 → 081-XXX-5678
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-XXX-${phone.slice(6)}`;
}

export function BookingRow({
  id,
  slotTime,
  phone,
  date,
}: {
  id: string;
  slotTime: string;
  phone: string;
  date: string;
}) {
  const [revealed, setRevealed] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Cancel the ${slotTime} booking? This cannot be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="font-display numerals text-3xl text-burgundy">{slotTime}</span>
        <span className="numerals text-sm text-ink-soft">
          {revealed ? phone : maskPhone(phone)}
        </span>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="tracking-mark text-[0.65rem] text-ink-faint underline-offset-4 hover:text-burgundy hover:underline"
          aria-label={revealed ? 'Hide phone number' : 'Show phone number'}
        >
          {revealed ? 'Hide' : 'Show'}
        </button>
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
