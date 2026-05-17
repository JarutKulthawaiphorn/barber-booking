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
    <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{slotTime}</span>
        <span className="font-mono text-zinc-600 dark:text-zinc-400">
          {revealed ? phone : maskPhone(phone)}
        </span>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="text-xs text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
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
          className="text-sm text-red-600 hover:underline dark:text-red-400"
        >
          Cancel
        </button>
      </form>
    </li>
  );
}
