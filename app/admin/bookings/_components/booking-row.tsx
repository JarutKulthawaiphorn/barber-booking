'use client';

import { type FormEvent } from 'react';

import { adminCancelBookingAction } from '../actions';

function formatPhone(p: string): string {
  return p.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

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
    if (!window.confirm(`ยกเลิกการจองเวลา ${slotTime} ใช่หรือไม่? ไม่สามารถย้อนกลับได้`)) {
      e.preventDefault();
    }
  }

  return (
    <li
      className="grid items-center px-4 py-3 text-[14px]"
      style={{
        gridTemplateColumns: '110px 1fr 180px 140px 80px',
        gap: 12,
      }}
    >
      <span className="tnum font-medium">{slotTime}</span>
      <span className="truncate">{customerName}</span>
      <span className="tnum" style={{ color: 'var(--color-muted)' }}>
        {formatPhone(phone)}
      </span>
      <span style={{ color: 'var(--color-ink-2)' }}>
        {barberName ?? '—'}
      </span>
      <span className="flex justify-end">
        <form action={adminCancelBookingAction} onSubmit={handleSubmit}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="date" value={date} />
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            style={{
              padding: '0 10px',
              height: 30,
              fontSize: 13,
              color: 'var(--color-danger)',
            }}
          >
            ยกเลิก
          </button>
        </form>
      </span>
    </li>
  );
}
