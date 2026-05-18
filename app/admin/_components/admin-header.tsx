import Link from 'next/link';

type Tab = 'bookings' | 'settings';

export function AdminHeader({ username, active }: { username: string; active: Tab }) {
  return (
    <header style={{ borderBottom: '1px solid var(--color-border)' }} className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-bg)',
              letterSpacing: '-0.02em',
            }}
          >
            B
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">
              Bangkok Barber
            </div>
            <div
              className="text-[12px] leading-tight"
              style={{ color: 'var(--color-muted)' }}
            >
              Logged in as <span style={{ color: 'var(--color-ink-2)' }}>{username}</span>
            </div>
          </div>
        </div>
        <form action="/admin/logout" method="post">
          <button type="submit" className="btn btn-ghost btn-sm">
            Sign out
          </button>
        </form>
      </div>

      <nav className="mt-3 flex items-center gap-1 px-1">
        <TabLink href="/admin/bookings" active={active === 'bookings'}>
          Schedule
        </TabLink>
        <TabLink href="/admin" active={active === 'settings'}>
          Shop settings
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
      className="text-[14px] no-underline"
      style={{
        padding: '8px 12px',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--color-ink)' : 'var(--color-muted)',
        borderBottom: active
          ? '2px solid var(--color-ink)'
          : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {children}
    </Link>
  );
}
