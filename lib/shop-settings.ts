import { getSupabase } from './supabase/server';
import { todayInBangkok } from './timezone';

export type ShopSettings = {
  openTime: string;
  closeTime: string;
  weeklyClosedWeekday: number;
};

export type ClosedDate = {
  id: string;
  closedOn: string;
  note: string | null;
};

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
  if (
    !Number.isInteger(input.weeklyClosedWeekday) ||
    input.weeklyClosedWeekday < 0 ||
    input.weeklyClosedWeekday > 6
  ) {
    throw new Error('weeklyClosedWeekday must be an integer between 0 and 6');
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

export async function getShopSettings(): Promise<ShopSettings> {
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
    weeklyClosedWeekday: data.weekly_closed_weekday as number,
  };
}

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

export async function listClosedDates(opts?: {
  from?: string;
  to?: string;
}): Promise<ClosedDate[]> {
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
