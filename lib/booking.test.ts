import { describe, expect, it } from 'vitest';

import {
  addDays,
  availableSlots,
  enumerateSlots,
  getWeekday,
  listBookableDates,
  normalizePhone,
  validatePhone,
} from './booking';
import type { ClosedDate, ShopSettings } from './shop-settings';

describe('normalizePhone', () => {
  it('strips spaces and dashes', () => {
    expect(normalizePhone('081-234-5678')).toBe('0812345678');
    expect(normalizePhone('081 234 5678')).toBe('0812345678');
    expect(normalizePhone(' 0812345678 ')).toBe('0812345678');
  });

  it('leaves a clean number alone', () => {
    expect(normalizePhone('0812345678')).toBe('0812345678');
  });
});

describe('validatePhone', () => {
  it('accepts Thai mobile prefixes 06/08/09', () => {
    expect(validatePhone('0612345678')).toBe('0612345678');
    expect(validatePhone('0812345678')).toBe('0812345678');
    expect(validatePhone('0912345678')).toBe('0912345678');
  });

  it('accepts formatted Thai mobile', () => {
    expect(validatePhone('081-234-5678')).toBe('0812345678');
    expect(validatePhone('081 234 5678')).toBe('0812345678');
  });

  it('rejects non-mobile prefix (02 landline, 05 unused, 07 unused)', () => {
    expect(() => validatePhone('0212345678')).toThrow();
    expect(() => validatePhone('0512345678')).toThrow();
    expect(() => validatePhone('0712345678')).toThrow();
  });

  it('rejects wrong length', () => {
    expect(() => validatePhone('081234567')).toThrow();
    expect(() => validatePhone('08123456789')).toThrow();
  });

  it('rejects missing leading zero', () => {
    expect(() => validatePhone('812345678')).toThrow();
  });

  it('rejects empty', () => {
    expect(() => validatePhone('')).toThrow();
  });
});

describe('enumerateSlots', () => {
  it('09:00 to 19:00 produces 20 slots from 09:00 to 18:30', () => {
    const slots = enumerateSlots('09:00', '19:00');
    expect(slots).toHaveLength(20);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('18:30');
  });

  it('drops a sub-30-minute remainder at the end (09:00–19:15 → 20 slots)', () => {
    const slots = enumerateSlots('09:00', '19:15');
    expect(slots).toHaveLength(20);
    expect(slots[slots.length - 1]).toBe('18:30');
  });

  it('produces exactly one slot for an exactly-30-minute window', () => {
    expect(enumerateSlots('09:00', '09:30')).toEqual(['09:00']);
  });

  it('produces no slots for a zero-length window', () => {
    expect(enumerateSlots('09:00', '09:00')).toEqual([]);
  });

  it('rejects malformed times', () => {
    expect(() => enumerateSlots('9:00', '19:00')).toThrow();
    expect(() => enumerateSlots('09:00', '7pm')).toThrow();
  });
});

describe('getWeekday', () => {
  it('returns JS-style 0..6 for known dates', () => {
    // 2026-05-17 is a Sunday.
    expect(getWeekday('2026-05-17')).toBe(0);
    // 2026-05-18 is a Monday.
    expect(getWeekday('2026-05-18')).toBe(1);
    // 2026-05-23 is a Saturday.
    expect(getWeekday('2026-05-23')).toBe(6);
  });

  it('rejects malformed input', () => {
    expect(() => getWeekday('2026/05/17')).toThrow();
  });
});

describe('addDays', () => {
  it('adds days within the same month', () => {
    expect(addDays('2026-05-17', 3)).toBe('2026-05-20');
  });

  it('rolls over the end of the month', () => {
    expect(addDays('2026-05-30', 5)).toBe('2026-06-04');
  });

  it('rolls over the end of the year', () => {
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('handles a leap day', () => {
    // 2028 is a leap year.
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });
});

describe('listBookableDates', () => {
  const settings: ShopSettings = {
    openTime: '09:00',
    closeTime: '19:00',
    weeklyClosedWeekday: 1, // closed Monday
  };

  it('produces 14 entries minus the weekly closed weekday', () => {
    const dates = listBookableDates({
      settings,
      closedDates: [],
      today: '2026-05-17', // Sunday
    });
    // 14-day window from Sun May 17. Mondays in window: May 18, May 25 → 2 closed.
    expect(dates).toHaveLength(12);
    expect(dates[0]).toBe('2026-05-17');
    expect(dates).not.toContain('2026-05-18');
    expect(dates).not.toContain('2026-05-25');
    expect(dates[dates.length - 1]).toBe('2026-05-30');
  });

  it('drops one-off closed dates inside the window', () => {
    const closed: ClosedDate[] = [{ id: 'x', closedOn: '2026-05-20', note: null }];
    const dates = listBookableDates({
      settings,
      closedDates: closed,
      today: '2026-05-17',
    });
    expect(dates).not.toContain('2026-05-20');
  });

  it('respects a custom lookAheadDays', () => {
    const dates = listBookableDates({
      settings: { ...settings, weeklyClosedWeekday: 7 as unknown as number }, // never matches
      closedDates: [],
      today: '2026-05-17',
      lookAheadDays: 3,
    });
    expect(dates).toEqual(['2026-05-17', '2026-05-18', '2026-05-19']);
  });
});

describe('availableSlots', () => {
  const settings: ShopSettings = {
    openTime: '09:00',
    closeTime: '10:30',
    weeklyClosedWeekday: 1,
  };

  it('returns every slot when no bookings exist', () => {
    const slots = availableSlots({
      settings,
      closedDates: [],
      existingBookings: [],
      date: '2026-05-17',
      today: '2026-05-17',
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00']);
  });

  it('removes booked slots', () => {
    const slots = availableSlots({
      settings,
      closedDates: [],
      existingBookings: [{ slotTime: '09:30' }],
      date: '2026-05-17',
      today: '2026-05-17',
    });
    expect(slots).toEqual(['09:00', '10:00']);
  });

  it('returns empty when the date is the weekly closed weekday', () => {
    // 2026-05-18 is a Monday.
    expect(
      availableSlots({
        settings,
        closedDates: [],
        existingBookings: [],
        date: '2026-05-18',
        today: '2026-05-17',
      }),
    ).toEqual([]);
  });

  it('returns empty when the date is in closed_dates', () => {
    expect(
      availableSlots({
        settings,
        closedDates: [{ id: 'x', closedOn: '2026-05-19', note: null }],
        existingBookings: [],
        date: '2026-05-19',
        today: '2026-05-17',
      }),
    ).toEqual([]);
  });

  it('returns empty when the date is outside the bookable window', () => {
    expect(
      availableSlots({
        settings,
        closedDates: [],
        existingBookings: [],
        date: '2030-01-01',
        today: '2026-05-17',
      }),
    ).toEqual([]);
  });

  it('returns empty when the date is before today', () => {
    expect(
      availableSlots({
        settings,
        closedDates: [],
        existingBookings: [],
        date: '2026-05-16',
        today: '2026-05-17',
      }),
    ).toEqual([]);
  });
});
