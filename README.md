# Barber Booking

A single-shop barber queue app that covers the full booking loop — **browse hours →
pick a 30-minute slot → reserve by phone → look up or cancel** — with an admin surface
for staff to manage the day's bookings, shop hours, and closed dates.

The customer side needs no account: bookings are keyed to a Thai mobile number. The UI is
Thai-language throughout, runs on the `Asia/Bangkok` timezone, and renders dates on the Thai
Buddhist calendar.

Built on Next.js 16 (App Router, React Server Components, Server Actions) and Supabase, with
end-to-end TypeScript and pure, unit-tested domain logic.

## Features

- **Landing page (`/`)** — live shop hours and weekly closed day, services, and the booking
  entry points, computed server-side from current shop settings.
- **Customer booking (`/book`)** — pick a bookable date in the next 14 days and an open
  30-minute slot, then reserve with a Thai mobile number and name. Taken slots render as
  disabled, and a unique constraint prevents double-booking the same slot.
- **Booking lookup (`/lookup`)** — find all upcoming bookings for a phone number and cancel a
  future one; past bookings are not cancellable, and a booking can only be cancelled by the
  number that made it.
- **Admin bookings (`/admin/bookings`)** — view the day's bookings, create a booking on a
  customer's behalf (assigning a barber name), and cancel any booking.
- **Admin settings (`/admin`)** — set open/close times, the weekly closed weekday (or "open
  every day"), and one-off closed dates.
- **Admin authentication** — username/password login backed by env-configured staff accounts,
  with an HMAC-signed session cookie.

## Architecture

- **Domain logic is pure and isolated.** Slot enumeration, the bookable-date window, and Thai
  calendar/timezone formatting live in `lib/booking-domain.ts`, `lib/thai-date.ts`, and
  `lib/timezone.ts` — free of React and Supabase, and covered by co-located unit tests. Data
  access (`lib/booking.ts`, `lib/shop-settings.ts`) is the only layer that touches the database.
- **Admin auth is defense-in-depth.** `proxy.ts` (the Next 16 middleware) gates the `/admin`
  surface at the edge so unauthenticated requests never spend a render, while a page-level
  `requireAdmin()` re-checks on every request. The session cookie is HMAC-SHA256 signed
  (`lib/auth.ts`), and credential checks are constant-time to avoid leaking which field failed.
- **Server-only data path.** A single service-role Supabase client
  (`lib/supabase/server.ts`) is imported behind `server-only`, so the key can never reach the
  browser. Reads are tag-cached with `unstable_cache` and flushed on write via `revalidateTag`.
- **Validation at the boundary, twice.** Phone, name, date, and slot are validated in the
  domain layer before any insert, with the Postgres `CHECK`/`UNIQUE` constraints as the
  authoritative backstop.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router), React 19, TypeScript |
| Data | Supabase (Postgres), server-only service-role client |
| UI | Tailwind CSS v4 |
| Auth | HMAC-signed cookie sessions (`node:crypto`), env-configured admin accounts |
| Tooling | ESLint, Vitest, Playwright |

## Getting started

**Prerequisites:** Node.js 20+, pnpm, and a Supabase project.

```bash
pnpm install
cp .env.local.example .env.local   # fill in the values below
pnpm dev
```

Apply the SQL in `migrations/` to your Supabase project via the SQL editor. The app expects
three tables — `bookings`, `shop_settings`, and `closed_dates` — and reads shop settings from
the single `shop_settings` row with `id = 1`, so seed that row with your opening hours.

Open http://localhost:3000.

## Environment variables

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — bypasses RLS, server-only, never exposed to the client |
| `ADMIN_<N>_USERNAME` / `ADMIN_<N>_PASSWORD` | One staff admin account per index (`1`, `2`, …) |
| `ADMIN_COOKIE_SECRET` | Signs the admin session cookie (HMAC-SHA256); at least 64 hex chars |

Generate a cookie secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Run the app in dev / build / production |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm exec playwright test` | End-to-end tests (Playwright) |

## Testing

Unit tests are co-located with the domain logic they cover (`lib/*.test.ts`) and run with
Vitest. The admin login flow and a homepage smoke check are covered by Playwright specs in
`tests/`; set `TEST_ADMIN_USERNAME` / `TEST_ADMIN_PASSWORD` for the auth spec.

## Project structure

```text
app/                   Routes, pages, and server actions
  book/                Customer booking flow + confirmation
  lookup/              Find / cancel a booking by phone
  admin/               Admin login, shop settings, bookings management
  _actions/  _hooks/   Shared slot server action and client hook
lib/                   Pure domain logic and data access
  booking-domain.ts    Slot + bookable-date rules (pure, tested)
  booking.ts           Booking data access (Supabase)
  shop-settings.ts     Hours, weekly closed day, closed dates (cached)
  auth.ts              HMAC cookie sessions + admin credentials
  thai-date.ts         Thai / Buddhist calendar formatting
  timezone.ts          Asia/Bangkok date helpers
  supabase/server.ts   Service-role Supabase client (server-only)
proxy.ts               Edge gate for the /admin surface (Next 16 middleware)
migrations/            SQL migrations
tests/                 Playwright end-to-end tests
```
