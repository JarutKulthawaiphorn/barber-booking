export const BANGKOK_TZ = 'Asia/Bangkok' as const;

const bangkokDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BANGKOK_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatBangkokDate(date: Date): string {
  return bangkokDateFormatter.format(date);
}

export function todayInBangkok(now: Date = new Date()): string {
  return formatBangkokDate(now);
}
