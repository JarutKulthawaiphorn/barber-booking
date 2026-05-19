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
      {pending ? 'กำลังบันทึก…' : 'เพิ่มการจอง'}
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
        ไม่มีวันที่เปิดในช่วง 2 สัปดาห์ข้างหน้า กรุณาปรับเวลาทำการเพื่อจองล่วงหน้า
      </p>
    );
  }

  return (
    <form action={adminCreateBookingAction} className="card card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="field">
        <label className="label" htmlFor="ab-phone">
          เบอร์โทรลูกค้า
        </label>
        <div className="input-prefix">
          <input
            id="ab-phone"
            type="tel"
            name="phone"
            inputMode="numeric"
            required
            placeholder="081 234 5678"
            pattern="[0-9\s-]*"
            maxLength={15}
            className="input tnum"
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-name">
          ชื่อลูกค้า
        </label>
        <input
          id="ab-name"
          type="text"
          name="customerName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="ชื่อลูกค้า walk-in"
          className="input"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-barber">
          ช่างตัด
        </label>
        <input
          id="ab-barber"
          type="text"
          name="barberName"
          required
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          placeholder="ชื่อช่างที่ให้บริการ"
          className="input"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="ab-date">
          วันที่
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
          เวลา
        </span>
        <input type="hidden" name="bookedOn" value={date} required />
        <input type="hidden" name="slotTime" value={selectedSlot} required />

        {slotsState.loading ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            กำลังโหลดคิว…
          </p>
        ) : slotsState.list.length === 0 ? (
          <p className="text-[14px]" style={{ color: 'var(--color-faint)' }}>
            {slotsState.error ?? 'ไม่มีคิวในวันนี้'}
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
