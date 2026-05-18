import Link from 'next/link';

type Tab = 'bookings' | 'settings';

export function AdminHeader({ username, active }: { username: string; active: Tab }) {
  return (
    <header className="reveal reveal-d1 border-b border-brass-pale/60 pb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="tracking-mark text-[0.65rem] text-brass">The Bangkok Barber</p>
          <p className="font-display mt-1 text-2xl text-ink">
            Owner&apos;s ledger
            <span className="ml-3 text-base italic text-ink-faint">
              · {username}
            </span>
          </p>
        </div>
        <form action="/admin/logout" method="post">
          <button type="submit" className="btn-link">
            Sign out →
          </button>
        </form>
      </div>

      <nav className="mt-6 flex items-center gap-1 text-sm">
        <TabLink href="/admin/bookings" active={active === 'bookings'}>
          Bookings
        </TabLink>
        <TabLink href="/admin" active={active === 'settings'}>
          Shop hours
        </TabLink>
      </nav>
    </header>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        'rounded-sm px-4 py-2 text-[0.78rem] tracking-mark transition-colors',
        active
          ? 'bg-ink text-paper'
          : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
