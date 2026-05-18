import 'server-only';

import { unstable_cache } from 'next/cache';

import { getSupabase } from './supabase/server';
import { todayInBangkok } from './timezone';

export type ShopSettings = {
  openTime: string;
  closeTime: string;
  /** 0 = Sunday … 6 = Saturday. `null` means the shop is open every day. */
  weeklyClosedWeekday: number | null;
};

export type ClosedDate = {
  id: string;
  closedOn: string;
  note: string | null;
};

/**
 * Cache tags. Mutations call `revalidateTag(...)` with these to flush all
 * cached reads in one call instead of hand-rolling per-path invalidations.
 */
export const SHOP_SETTINGS_TAG = 'shop-settings';
export const CLOSED_DATES_TAG = 'closed-dates';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseTimeMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

export function validateShopSettings(input: ShopSettings): void {
  if (!TIME_RE.test(input.openTime)) {
    throw new Error('openTime must be in HH:MM 24-hour format');
  }
  if (!TIME_RE.test(input.closeTime)) {
    throw new Error('closeTime must be in HH:MM 24-hour format');
  }
  const open = parseTimeMinutes(input.openTime);
  const close = parseTimeMinutes(input.closeTime);
  if (open >= close) {
    throw new Error('openTime must be earlier than closeTime');
  }
  if (close - open < 30) {
    throw new Error('Shop must be open for at least 30 minutes');
  }
  if (input.weeklyClosedWeekday !== null) {
    if (
      !Number.isInteger(input.weeklyClosedWeekday) ||
      input.weeklyClosedWeekday < 0 ||
      input.weeklyClosedWeekday > 6
    ) {
      throw new Error('weeklyClosedWeekday must be an integer between 0 and 6, or null');
    }
  }
}

export function validateClosedDate(closedOn: string, today: string = todayInBangkok()): void {
  if (!DATE_RE.test(closedOn)) {
    throw new Error('closedOn must be in YYYY-MM-DD format');
  }
  if (closedOn < today) {
    throw new Error('closedOn must not be in the past');
  }
}

// ---------------------------------------------------------------------------
// Cached reads
//
// Both reads are tag-cached: cheap on read (in-process across requests),
// flushed instantly on write via `revalidateTag(SHOP_SETTINGS_TAG)` /
// `revalidateTag(CLOSED_DATES_TAG)` from the admin server actions.
// ---------------------------------------------------------------------------

async function loadShopSettings(): Promise<ShopSettings> {
  const { data, error } = await getSupabase()
    .from('shop_settings')
    .select('open_time, close_time, weekly_closed_weekday')
    .eq('id', 1)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load shop settings: ${error?.message ?? 'no row'}`);
  }

  return {
    openTime: String(data.open_time).slice(0, 5),
    closeTime: String(data.close_time).slice(0, 5),
    weeklyClosedWeekday: data.weekly_closed_weekday as number | null,
  };
}

export const getShopSettings = unstable_cache(
  loadShopSettings,
  ['shop-settings:v1'],
  { tags: [SHOP_SETTINGS_TAG] },
);

async function loadClosedDates(opts?: { from?: string; to?: string }): Promise<ClosedDate[]> {
  let query = getSupabase()
    .from('closed_dates')
    .select('id, closed_on, note')
    .order('closed_on');

  if (opts?.from) query = query.gte('closed_on', opts.from);
  if (opts?.to) query = query.lte('closed_on', opts.to);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list closed dates: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    closedOn: row.closed_on as string,
    note: (row.note as string | null) ?? null,
  }));
}

/**
 * `from`/`to` are captured as part of the cache key, so different windows get
 * independent cache entries. `unstable_cache` does not see closures, so the
 * args are passed through verbatim and serialise into the key.
 */
export const listClosedDates = unstable_cache(
  loadClosedDates,
  ['closed-dates:v1'],
  { tags: [CLOSED_DATES_TAG] },
);

// ---------------------------------------------------------------------------
// Mutations (uncached; tagged caches above are invalidated by server actions)
// ---------------------------------------------------------------------------

export async function updateShopSettings(input: ShopSettings): Promise<void> {
  validateShopSettings(input);
  const { error } = await getSupabase()
    .from('shop_settings')
    .update({
      open_time: input.openTime,
      close_time: input.closeTime,
      weekly_closed_weekday: input.weeklyClosedWeekday,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw new Error(`Failed to update shop settings: ${error.message}`);
}

export async function addClosedDate(input: {
  closedOn: string;
  note?: string | null;
}): Promise<void> {
  validateClosedDate(input.closedOn);
  const { error } = await getSupabase()
    .from('closed_dates')
    .insert({ closed_on: input.closedOn, note: input.note ?? null });

  if (error) {
    if (error.code === '23505') throw new Error('That date is already closed');
    throw new Error(`Failed to add closed date: ${error.message}`);
  }
}

export async function removeClosedDate(id: string): Promise<void> {
  const { error } = await getSupabase().from('closed_dates').delete().eq('id', id);
  if (error) throw new Error(`Failed to remove closed date: ${error.message}`);
}
