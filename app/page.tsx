import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Barbershop appointments
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Book a 30-minute slot, or pull up an existing reservation with your phone number.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/book"
          className="rounded-md bg-zinc-900 px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Book an appointment
        </Link>
        <Link
          href="/lookup"
          className="rounded-md border border-zinc-300 px-5 py-3 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Look up my booking
        </Link>
      </div>

      <p className="mt-12 text-xs text-zinc-400 dark:text-zinc-600">
        Booking and lookup go live in the next milestones.
      </p>
    </main>
  );
}
