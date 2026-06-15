import { describe, expect, it } from 'vitest';

import {
  dayNumber,
  formatLongDateWithYear,
  formatShortDate,
  formatShortDateWithYear,
  weekdayShort,
} from './thai-date';

// 2026-06-13 is a Saturday; 2026-05-17 is a Sunday.
describe('thai-date formatters', () => {
  it('reads day number and short weekday', () => {
    expect(dayNumber('2026-06-13')).toBe(13);
    expect(weekdayShort('2026-06-13')).toBe('ส');
    expect(weekdayShort('2026-05-17')).toBe('อา');
  });

  it('formats short date without year', () => {
    expect(formatShortDate('2026-06-13')).toBe('ส 13 มิ.ย.');
  });

  it('formats short date with Buddhist year (Gregorian + 543)', () => {
    expect(formatShortDateWithYear('2026-06-13')).toBe('ส 13 มิ.ย. 2569');
  });

  it('formats long date with Buddhist year', () => {
    expect(formatLongDateWithYear('2026-05-17')).toBe('อาทิตย์ 17 พฤษภาคม 2569');
  });

  it('rejects malformed input', () => {
    expect(() => formatShortDate('2026/06/13')).toThrow();
  });
});
