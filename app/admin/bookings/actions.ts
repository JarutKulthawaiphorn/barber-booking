'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth';
import { adminCancelBooking, adminCreateBooking } from '@/lib/booking';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
}

function redirectBack(date: string, params: Record<string, string>): never {
  const search = new URLSearchParams({ date, ...params });
  redirect(`/admin/bookings?${search.toString()}`);
}

export async function adminCreateBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const phone = String(formData.get('phone') ?? '');
  const customerName = String(formData.get('customerName') ?? '');
  const barberName = String(formData.get('barberName') ?? '');
  const bookedOn = String(formData.get('bookedOn') ?? '');
  const slotTime = String(formData.get('slotTime') ?? '');

  try {
    await adminCreateBooking({ phone, customerName, barberName, bookedOn, slotTime });
  } catch (err) {
    redirectBack(bookedOn, { error: errorMessage(err) });
  }

  revalidatePath('/admin/bookings');
  redirectBack(bookedOn, { ok: 'เพิ่มการจองแล้ว' });
}

export async function adminCancelBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const date = String(formData.get('date') ?? '');
  if (!id) redirectBack(date, { error: 'ไม่พบรหัสการจอง' });

  try {
    await adminCancelBooking(id);
  } catch (err) {
    redirectBack(date, { error: errorMessage(err) });
  }

  revalidatePath('/admin/bookings');
  redirectBack(date, { ok: 'ยกเลิกการจองแล้ว' });
}
