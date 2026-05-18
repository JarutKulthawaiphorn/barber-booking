import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <p
        className="text-[13px] font-semibold uppercase"
        style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}
      >
        404
      </p>
      <h1 className="mt-2 text-[22px] font-semibold">Page not found</h1>
      <p className="mt-2 text-[14px]" style={{ color: 'var(--color-muted)' }}>
        The page you were looking for has moved or never existed.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Link href="/book" className="btn btn-primary">
          Book a chair
        </Link>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
