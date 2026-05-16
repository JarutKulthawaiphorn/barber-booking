'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth';
import { addClosedDate, removeClosedDate, updateShopSettings } from '@/lib/shop-settings';

function redirectWithError(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  try {
    await updateShopSettings({
      openTime: String(formData.get('openTime') ?? ''),
      closeTime: String(formData.get('closeTime') ?? ''),
      weeklyClosedWeekday: Number(formData.get('weeklyClosedWeekday')),
    });
  } catch (err) {
    redirectWithError(errorMessage(err));
  }

  revalidatePath('/admin');
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

  revalidatePath('/admin');
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

  revalidatePath('/admin');
  redirect('/admin?ok=1');
}
