import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/auth';

import { loginAction } from './actions';

export const metadata: Metadata = {
  title: 'Staff login',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Username and password are required.',
  invalid: 'Invalid username or password.',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminSession()) {
    redirect('/admin/bookings');
  }

  const params = await searchParams;
  const error = params.error ? (ERROR_MESSAGES[params.error] ?? 'Login failed.') : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-stretch justify-center px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md text-[15px] font-bold"
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-bg)',
            letterSpacing: '-0.02em',
          }}
        >
          B
        </div>
        <h1 className="mt-1 text-[22px] font-semibold">Staff login</h1>
        <p className="text-[14px]" style={{ color: 'var(--color-muted)' }}>
          The Bangkok Barber — admin area
        </p>
      </div>

      <form
        action={loginAction}
        className="card card-pad mt-6 flex flex-col gap-4"
      >
        <div className="field">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            required
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>

        {error ? (
          <p className="banner banner-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block">
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center">
        <Link
          href="/"
          className="text-[14px] no-underline"
          style={{ color: 'var(--color-muted)' }}
        >
          ← Back to The Bangkok Barber
        </Link>
      </p>
    </main>
  );
}
