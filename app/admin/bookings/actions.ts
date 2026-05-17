'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth';
import { adminCancelBooking } from '@/lib/booking';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

function redirectBack(date: string, params: Record<string, string>): never {
  const search = new URLSearchParams({ date, ...params });
  redirect(`/admin/bookings?${search.toString()}`);
}

export async function adminCancelBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const date = String(formData.get('date') ?? '');
  if (!id) redirectBack(date, { error: 'Missing booking id' });

  try {
    await adminCancelBooking(id);
  } catch (err) {
    redirectBack(date, { error: errorMessage(err) });
  }

  revalidatePath('/admin/bookings');
  redirectBack(date, { ok: 'Booking cancelled' });
}
