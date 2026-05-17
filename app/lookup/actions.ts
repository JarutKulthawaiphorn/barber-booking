'use server';

import { redirect } from 'next/navigation';

import { cancelBooking, validatePhone } from '@/lib/booking';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export async function lookupBookingsAction(formData: FormData): Promise<void> {
  const raw = String(formData.get('phone') ?? '');

  let phone: string;
  try {
    phone = validatePhone(raw);
  } catch (err) {
    redirect(`/lookup?error=${encodeURIComponent(errorMessage(err))}`);
  }

  redirect(`/lookup?phone=${phone}`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const phone = String(formData.get('phone') ?? '');

  try {
    await cancelBooking({ id, phone });
  } catch (err) {
    redirect(
      `/lookup?phone=${encodeURIComponent(phone)}&error=${encodeURIComponent(errorMessage(err))}`,
    );
  }

  redirect(`/lookup?phone=${encodeURIComponent(phone)}&ok=${encodeURIComponent('Booking cancelled')}`);
}
