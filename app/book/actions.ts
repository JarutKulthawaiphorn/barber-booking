'use server';

import { redirect } from 'next/navigation';

import { createBooking } from '@/lib/booking';

function redirectWithError(message: string): never {
  redirect(`/book?error=${encodeURIComponent(message)}`);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export async function createBookingAction(formData: FormData): Promise<void> {
  const phone = String(formData.get('phone') ?? '');
  const customerName = String(formData.get('customerName') ?? '');
  const bookedOn = String(formData.get('bookedOn') ?? '');
  const slotTime = String(formData.get('slotTime') ?? '');

  let bookingId: string;
  try {
    const booking = await createBooking({ phone, customerName, bookedOn, slotTime });
    bookingId = booking.id;
  } catch (err) {
    redirectWithError(errorMessage(err));
  }

  redirect(`/book/confirmed?id=${bookingId}`);
}
