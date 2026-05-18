'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth';
import {
  CLOSED_DATES_TAG,
  SHOP_SETTINGS_TAG,
  addClosedDate,
  removeClosedDate,
  updateShopSettings,
} from '@/lib/shop-settings';

function redirectWithError(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const rawWeekday = Number(formData.get('weeklyClosedWeekday'));
  const weeklyClosedWeekday = rawWeekday === -1 ? null : rawWeekday;

  try {
    await updateShopSettings({
      openTime: String(formData.get('openTime') ?? ''),
      closeTime: String(formData.get('closeTime') ?? ''),
      weeklyClosedWeekday,
    });
  } catch (err) {
    redirectWithError(errorMessage(err));
  }

  // Flush the tagged cache so the home page + booking flow see the new hours
  // on the next request, without forcing a per-path revalidate list.
  updateTag(SHOP_SETTINGS_TAG);
  redirect('/admin?ok=1');
}

export async function addClosedDateAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const closedOn = String(formData.get('closedOn') ?? '');
  const noteRaw = formData.get('note');
  const note = typeof noteRaw === 'string' && noteRaw.trim() ? noteRaw.trim() : null;

  try {
    await addClosedDate({ closedOn, note });
  } catch (err) {
    redirectWithError(errorMessage(err));
  }

  updateTag(CLOSED_DATES_TAG);
  redirect('/admin?ok=1');
}

export async function removeClosedDateAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) redirectWithError('Missing closed-date id');

  try {
    await removeClosedDate(id);
  } catch (err) {
    redirectWithError(errorMessage(err));
  }

  updateTag(CLOSED_DATES_TAG);
  redirect('/admin?ok=1');
}
