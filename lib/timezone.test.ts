import { afterEach, describe, expect, it, vi } from 'vitest';

import { BANGKOK_TZ, formatBangkokDate, todayInBangkok } from './timezone';

describe('timezone helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('BANGKOK_TZ is Asia/Bangkok', () => {
    expect(BANGKOK_TZ).toBe('Asia/Bangkok');
  });

  it('formatBangkokDate rolls over to next day at 17:00 UTC (00:00 Bangkok)', () => {
    expect(formatBangkokDate(new Date('2026-05-16T16:59:59Z'))).toBe('2026-05-16');
    expect(formatBangkokDate(new Date('2026-05-16T17:00:00Z'))).toBe('2026-05-17');
  });

  it('formatBangkokDate returns same day for afternoon UTC', () => {
    expect(formatBangkokDate(new Date('2026-05-16T10:00:00Z'))).toBe('2026-05-16');
  });

  it('todayInBangkok uses the fake system clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T17:30:00Z'));
    expect(todayInBangkok()).toBe('2026-05-17');
  });
});
