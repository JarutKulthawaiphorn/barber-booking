import Link from 'next/link';

import { loginAction } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Username and password are required.',
  invalid: 'Invalid username or password.',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? (ERROR_MESSAGES[params.error] ?? 'Login failed.') : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="reveal reveal-d1 tracking-mark text-center text-xs text-brass">
          № 00 — Staff entrance
        </p>

        <h1 className="reveal reveal-d2 font-display mt-3 text-center text-4xl text-ink">
          The owner&apos;s <em className="font-display italic text-burgundy not-italic">ledger</em>
        </h1>

        <form
          action={loginAction}
          className="reveal reveal-d3 corner-brackets card-paper mt-10 p-8 sm:p-10"
        >
          <label className="block">
            <span className="label-mark">Username</span>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              className="input-vintage"
            />
          </label>

          <label className="mt-6 block">
            <span className="label-mark">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="input-vintage"
            />
          </label>

          {error ? (
            <p className="banner-error mt-5" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary mt-8 w-full">
            Sign in
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="mt-8 text-center">
          <Link href="/" className="btn-link">
            ← The Bangkok Barber
          </Link>
        </p>
      </div>
    </main>
  );
}
