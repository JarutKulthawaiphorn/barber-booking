// Thai calendar text + date-label formatters, shared across pages.
//
// ponytail: hand-rolled arrays rather than Intl('th-TH'). Intl's CLDR data
// renders short weekdays with a trailing dot ("อา.") and long weekdays with a
// "วัน" prefix ("วันอาทิตย์"); this UI wants the bare forms. Months happen to
// match Intl exactly, but weekdays don't — so we keep explicit arrays to get
// byte-exact output. Upgrade path: if the dotted/prefixed forms become
// acceptable, drop these and format with Intl + `-u-ca-buddhist`.

const WEEKDAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as const;

const MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const;

const MONTH_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
] as const;

/** Long Thai weekday names (อาทิตย์ … เสาร์), indexed 0 = Sunday. */
export const THAI_WEEKDAY_NAMES = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์',
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a YYYY-MM-DD string at UTC midnight so labels are timezone-neutral. */
function parts(yyyyMmDd: string): { dow: number; day: number; month: number; year: number } {
  if (!DATE_RE.test(yyyyMmDd)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    dow: dt.getUTCDay(),
    day: dt.getUTCDate(),
    month: dt.getUTCMonth(),
    year: dt.getUTCFullYear(),
  };
}

/** Day-of-month number, e.g. 13. */
export function dayNumber(yyyyMmDd: string): number {
  return parts(yyyyMmDd).day;
}

/** Short Thai weekday, e.g. "ศ". */
export function weekdayShort(yyyyMmDd: string): string {
  return WEEKDAY_SHORT[parts(yyyyMmDd).dow];
}

/** "ศ 13 มิ.ย." — short weekday + day + short month, no year. */
export function formatShortDate(yyyyMmDd: string): string {
  const { dow, day, month } = parts(yyyyMmDd);
  return `${WEEKDAY_SHORT[dow]} ${day} ${MONTH_SHORT[month]}`;
}

/** "ศ 13 มิ.ย. 2569" — short form + Thai Buddhist year (Gregorian + 543). */
export function formatShortDateWithYear(yyyyMmDd: string): string {
  const { dow, day, month, year } = parts(yyyyMmDd);
  return `${WEEKDAY_SHORT[dow]} ${day} ${MONTH_SHORT[month]} ${year + 543}`;
}

/** "ศุกร์ 13 มิถุนายน 2569" — long weekday + day + long month + Buddhist year. */
export function formatLongDateWithYear(yyyyMmDd: string): string {
  const { dow, day, month, year } = parts(yyyyMmDd);
  return `${THAI_WEEKDAY_NAMES[dow]} ${day} ${MONTH_LONG[month]} ${year + 543}`;
}
