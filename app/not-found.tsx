import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="tracking-mark text-xs text-brass">№ 404 — Wrong door</p>
      <h1 className="font-display mt-4 text-5xl text-ink">
        Nothing on <em className="font-display italic text-burgundy not-italic">this chair</em>
      </h1>
      <p className="mt-4 text-sm text-ink-soft">
        The page you were looking for has moved or never existed.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        <Link href="/book" className="btn-primary">
          Book a chair
        </Link>
        <Link href="/" className="btn-link">
          Back to home
        </Link>
      </div>
    </main>
  );
}
