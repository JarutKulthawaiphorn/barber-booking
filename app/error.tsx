'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Root error boundary — catches uncaught errors from any route below `app/`.
 * Must be a client component per Next.js convention.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to whatever monitoring is plugged in later.
    // For now, the dev overlay + console is the floor.
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="tracking-mark text-xs text-brass">№ — Something snapped</p>
      <h1 className="font-display mt-4 text-4xl text-ink">
        The <em className="font-display italic text-burgundy not-italic">shop</em> is sweeping up
      </h1>
      <p className="mt-4 text-sm text-ink-soft">
        Something went wrong on our side. Try again in a moment.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs tracking-mark text-ink-faint">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-link">
          Back to home
        </Link>
      </div>
    </main>
  );
}
