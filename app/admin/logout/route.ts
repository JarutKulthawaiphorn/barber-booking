import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 });
}
