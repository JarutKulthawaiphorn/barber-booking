import { describe, expect, it } from 'vitest';

import { validateClosedDate, validateShopSettings } from './shop-settings';

describe('validateShopSettings', () => {
  const valid = { openTime: '09:00', closeTime: '19:00', weeklyClosedWeekday: 1 };

  it('accepts a valid input', () => {
    expect(() => validateShopSettings(valid)).not.toThrow();
  });

  it('rejects bad openTime format', () => {
    expect(() => validateShopSettings({ ...valid, openTime: '9:00' })).toThrow();
    expect(() => validateShopSettings({ ...valid, openTime: '24:00' })).toThrow();
    expect(() => validateShopSettings({ ...valid, openTime: '09:60' })).toThrow();
  });

  it('rejects bad closeTime format', () => {
    expect(() => validateShopSettings({ ...valid, closeTime: '7pm' })).toThrow();
  });

  it('rejects closeTime equal to or earlier than openTime', () => {
    expect(() =>
      validateShopSettings({ ...valid, openTime: '19:00', closeTime: '19:00' }),
    ).toThrow();
    expect(() =>
      validateShopSettings({ ...valid, openTime: '20:00', closeTime: '19:00' }),
    ).toThrow();
  });

  it('rejects shop open less than 30 minutes', () => {
    expect(() =>
      validateShopSettings({ ...valid, openTime: '09:00', closeTime: '09:15' }),
    ).toThrow();
  });

  it('accepts exactly 30 minutes', () => {
    expect(() =>
      validateShopSettings({ ...valid, openTime: '09:00', closeTime: '09:30' }),
    ).not.toThrow();
  });

  it('rejects weeklyClosedWeekday out of range or non-integer', () => {
    expect(() => validateShopSettings({ ...valid, weeklyClosedWeekday: -1 })).toThrow();
    expect(() => validateShopSettings({ ...valid, weeklyClosedWeekday: 7 })).toThrow();
    expect(() => validateShopSettings({ ...valid, weeklyClosedWeekday: 1.5 })).toThrow();
  });
});

describe('validateClosedDate', () => {
  it('rejects bad date format', () => {
    expect(() => validateClosedDate('2026/05/16', '2026-05-16')).toThrow();
    expect(() => validateClosedDate('not-a-date', '2026-05-16')).toThrow();
  });

  it('rejects past dates', () => {
    expect(() => validateClosedDate('2025-12-31', '2026-05-16')).toThrow();
  });

  it('accepts today', () => {
    expect(() => validateClosedDate('2026-05-16', '2026-05-16')).not.toThrow();
  });

  it('accepts future dates', () => {
    expect(() => validateClosedDate('2027-01-01', '2026-05-16')).not.toThrow();
  });
});
