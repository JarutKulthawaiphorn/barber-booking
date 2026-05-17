'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ADMIN_COOKIE_MAX_AGE_SEC,
  ADMIN_COOKIE_NAME,
  signAdminCookie,
  verifyAdminCredentials,
} from '@/lib/auth';

export async function loginAction(formData: FormData): Promise<void> {
  const username = formData.get('username');
  const password = formData.get('password');

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    redirect('/admin/login?error=missing');
  }

  if (!verifyAdminCredentials(username.trim(), password)) {
    redirect('/admin/login?error=invalid');
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signAdminCookie(username.trim()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE_SEC,
  });

  redirect('/admin/bookings');
}
