---
status: draft
awaiting: user-confirmation
---

# Plan: Shop hours and closed days configurable

**Source PRD**: `.claude/prds/barber-booking.prd.md`
**Selected Milestone**: #1 — Shop hours and closed days configurable
**Complexity**: Medium (this milestone carries the foundation — DB, env, admin auth, schema — that Milestones 2 and 3 will reuse)

## Summary
Stand up the foundation for the whole MVP: Supabase Postgres, an env-var-password admin login, and an admin settings page where the owner sets one daily open time, one daily close time, one weekly closed weekday, and zero-or-more one-off closed dates. All times and dates are interpreted in `Asia/Bangkok`. The persisted settings are exposed via a server-side data access layer so Milestone 2's booking UI can consume them without touching Supabase directly.

## Decisions locked in this planning round
| Decision | Choice |
|---|---|
| Persistence | Supabase Postgres (no Supabase Auth — data store only) |
| Admin auth | Single `ADMIN_PASSWORD` env var → HMAC-signed HttpOnly cookie |
| Hours model | One open/close pair, applied to every open day |
| Timezone | `Asia/Bangkok`, fixed in code |

These resolve PRD open questions on auth, timezone, and per-weekday vs. global hours. Remaining PRD open questions (rate-limiting, double-booking concurrency, phone format, retention) belong to Milestones 2 and 3 and are *not* in scope here.

## Patterns to Mirror
The repo currently contains only the Create Next App scaffold. **No similar code exists in this codebase** — we are establishing the patterns this milestone, and Milestones 2 and 3 will mirror what we land here.

What we WILL mirror is Next.js 16.2.6's own guidance bundled in `node_modules/next/dist/docs/`:

| Category | Reference doc |
|---|---|
| Server Actions | `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` — verified async, security guidance to authenticate inside the action |
| Cookies | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — `cookies()` is async in Next 15+, must `await` |
| Forms | `node_modules/next/dist/docs/01-app/02-guides/forms.md` (read before writing the admin form) |
| Auth recipes | `node_modules/next/dist/docs/01-app/02-guides/authentication.md` (read before wiring login/logout) |

Per `AGENTS.md`: read these before writing any Next-specific code — APIs in v16.2.6 may diverge from older training data.

## Data Model

Two Postgres tables in Supabase. All times are `time` (no zone), all dates are `date` (no zone) — we interpret them in `Asia/Bangkok` in application code. Postgres `time`/`date` types are zone-naive, which is exactly what we want here.

```sql
-- Singleton row. Enforce singleton via a CHECK on id = 1.
create table shop_settings (
  id smallint primary key generated always as identity check (id = 1),
  open_time time not null default '09:00',
  close_time time not null default '19:00',
  -- 0 = Sunday … 6 = Saturday (matches JS Date.getDay)
  weekly_closed_weekday smallint not null default 1 check (weekly_closed_weekday between 0 and 6),
  updated_at timestamptz not null default now()
);

-- One-off closed dates layered on top of the weekly rule.
create table closed_dates (
  id uuid primary key default gen_random_uuid(),
  closed_on date not null unique,
  note text,
  created_at timestamptz not null default now()
);

-- Seed the singleton row.
insert into shop_settings (id) values (1);
```

**Validation rules** (enforced in the DAL, not just in Postgres):
- `open_time < close_time` — reject equal or inverted ranges
- `(close_time - open_time)` must be at least 30 minutes (one slot)
- `closed_on` must be `>= current_date` in Asia/Bangkok (no historical entries)
- `weekly_closed_weekday` in `[0, 6]`

## Files to Change

| File | Action | Why |
|---|---|---|
| `package.json` | UPDATE | Add `@supabase/supabase-js`, `vitest`, `@vitest/coverage-v8` (DAL tests only) |
| `.env.local.example` | CREATE | Document `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET` |
| `.gitignore` | UPDATE | Confirm `.env*.local` is ignored (Next default — verify) |
| `supabase/migrations/0001_init_shop_settings.sql` | CREATE | Schema above; applied via Supabase MCP `apply_migration` |
| `lib/supabase/server.ts` | CREATE | Server-side Supabase client using service-role key. Never imported from a Client Component. |
| `lib/timezone.ts` | CREATE | `BANGKOK_TZ` constant, `todayInBangkok()`, `toBangkokDate(date)`, `formatBangkokDate(date)` helpers — built on `Intl.DateTimeFormat`, no extra library |
| `lib/auth.ts` | CREATE | `verifyAdminPassword(input)`, `signAdminCookie()`, `verifyAdminCookie(value)`, `requireAdmin()` (throws + redirects) |
| `lib/shop-settings.ts` | CREATE | DAL: `getShopSettings()`, `updateShopSettings(input)`, `listClosedDates()`, `addClosedDate(input)`, `removeClosedDate(id)`. Includes validation rules above. |
| `lib/shop-settings.test.ts` | CREATE | Vitest unit tests for validation + DAL using an in-memory Supabase stub or a Supabase branch |
| `app/layout.tsx` | UPDATE | Set `metadata.title` to something real (scaffold says "Create Next App") |
| `app/page.tsx` | UPDATE | Replace scaffold landing with a minimal stub linking to `/admin` and `/book` (Milestone 2 will fill `/book`) |
| `app/admin/login/page.tsx` | CREATE | Password input form, submits to server action |
| `app/admin/login/actions.ts` | CREATE | `loginAction(formData)` — verify password, set signed cookie, redirect to `/admin` |
| `app/admin/logout/route.ts` | CREATE | `POST` → clear cookie, redirect to `/admin/login` |
| `app/admin/layout.tsx` | CREATE | Server component that calls `requireAdmin()` so every nested admin page is gated |
| `app/admin/page.tsx` | CREATE | Server component: load settings + closed dates, render `<ShopSettingsForm>` and `<ClosedDatesList>` |
| `app/admin/_components/shop-settings-form.tsx` | CREATE | Client component for open/close time + weekly closed day, posts to server action |
| `app/admin/_components/closed-dates-list.tsx` | CREATE | Client component listing closed dates with delete buttons and an "add date" form |
| `app/admin/actions.ts` | CREATE | `updateSettingsAction`, `addClosedDateAction`, `removeClosedDateAction` — all `'use server'`, all call `requireAdmin()` first, all `revalidatePath('/admin')` after writes |
| `middleware.ts` | CREATE (optional) | If `requireAdmin()` in the admin layout is enough, skip. Otherwise redirect unauthenticated `/admin/*` to `/admin/login`. Default: layout-only guard — simpler, avoids middleware edge-runtime constraints. |
| `vitest.config.ts` | CREATE | Vitest config (node env for the DAL tests) |

## Tasks

### Task 1: Supabase project + migration
- **Action**: Create a Supabase project (or branch) via MCP. Apply `0001_init_shop_settings.sql`. Capture URL + service-role key for `.env.local`.
- **Mirror**: First migration in repo — establishes pattern `supabase/migrations/NNNN_description.sql`.
- **Validate**: Supabase MCP `list_tables` shows `shop_settings` (1 row) and `closed_dates` (empty).

### Task 2: Env + Supabase client
- **Action**: Add `@supabase/supabase-js`. Create `.env.local.example` with the four required vars; note `ADMIN_COOKIE_SECRET` must be ≥ 32 random bytes (hex). Create `lib/supabase/server.ts` exporting a singleton service-role client; throw at module load if env is missing or `typeof window !== 'undefined'`.
- **Mirror**: Verify current Supabase JS API via Context7 MCP before writing — the client API has moved around.
- **Validate**: `pnpm build` succeeds. Smoke a read of the singleton row from a one-off `tsx` script.

### Task 3: Timezone helpers
- **Action**: Implement `lib/timezone.ts` using `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })` to derive `YYYY-MM-DD` for "today in Bangkok". No external date library.
- **Validate**: Vitest test freezes the system clock at `2026-05-16T17:30:00Z` (which is 00:30 on `2026-05-17` in Bangkok) and asserts `todayInBangkok()` returns `2026-05-17`.

### Task 4: Auth helpers
- **Action**: Implement `lib/auth.ts`:
  - `verifyAdminPassword(input)` — constant-time compare against `ADMIN_PASSWORD`.
  - `signAdminCookie()` — return `<random-32-bytes-hex>.<hmac-sha256-hex>` signed with `ADMIN_COOKIE_SECRET`.
  - `verifyAdminCookie(value)` — verify HMAC with constant-time compare on the digest.
  - `requireAdmin()` — read `await cookies()`, verify, `redirect('/admin/login')` on failure.
- **Mirror**: Next 16 `cookies()` is async (confirmed against the bundled cookies doc).
- **Validate**: Vitest tests round-trip a cookie, reject a tampered cookie, reject a wrong-secret cookie.

### Task 5: DAL with validation
- **Action**: Implement `lib/shop-settings.ts` with `getShopSettings`, `updateShopSettings`, `listClosedDates`, `addClosedDate`, `removeClosedDate`. Each write validates per the rules above. Return narrow plain objects, not raw Supabase rows.
- **Mirror**: First DAL in repo. Pattern established:
  - Validation lives at the DAL boundary.
  - DAL is the only place a `'use server'` action talks to Supabase.
  - DAL throws `Error` with stable messages; the action layer translates to user-facing strings.
- **Validate**: Vitest covers happy path + each validation rule + each error case.

### Task 6: Admin login + logout
- **Action**: Build `app/admin/login/page.tsx` (form), `app/admin/login/actions.ts` (server action — verify password, set cookie, `redirect('/admin')`), `app/admin/logout/route.ts` (clear cookie, redirect to login).
- **Mirror**: First server action in repo — pattern: top-of-file `'use server'`, validate input, call helper/DAL, redirect or return small object.
- **Validate**: Manual — visit `/admin` → redirected to `/admin/login` → wrong password shows error → right password sets cookie and lands on `/admin`. Logout clears the cookie and bounces back.

### Task 7: Admin settings UI
- **Action**: Build `app/admin/layout.tsx` (calls `requireAdmin()`), `app/admin/page.tsx` (loads data, renders form + list), the two client components, and `app/admin/actions.ts` (three `'use server'` actions; each calls `requireAdmin()` first, then DAL, then `revalidatePath('/admin')`).
- **Mirror**: Establishes the page-loads-data + server-action-mutates pattern Milestone 2's booking form will follow.
- **Validate**: Manual — change open/close, change weekly closed day, add a closed date, remove a closed date — all changes persist across reload. Attempt `close_time < open_time` and confirm the validation error surfaces.

### Task 8: Replace scaffold landing page
- **Action**: Edit `app/page.tsx` to a minimal public landing with two links: "Book an appointment" (→ `/book`, 404 until Milestone 2) and "Look up my booking" (→ `/lookup`, 404 until Milestone 3). Update `app/layout.tsx` metadata.
- **Mirror**: N/A — cleanup.
- **Validate**: `pnpm dev` shows the new landing at `/`.

## Validation
```bash
pnpm install
pnpm lint
pnpm build
pnpm vitest run
# Manual smoke (with `.env.local` populated):
pnpm dev
# Visit http://localhost:3000/ → click Admin → log in → edit settings → log out
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| `ADMIN_PASSWORD` brute-forceable from public internet | Medium | Document in README; add rate-limiting in a Milestone 3 hardening pass. For trial deployment, deploy behind a non-obvious URL and/or restrict by IP at the host. |
| Service-role key accidentally imported into a Client Component → leaks to bundle | Medium | `lib/supabase/server.ts` throws if `typeof window !== 'undefined'`; add ESLint `no-restricted-imports` rule for client files. |
| Next 16 API drift (server actions, async `cookies()`, async `params`) bites mid-implementation | Medium | Every Task references the bundled doc to consult first. |
| Timezone bugs around midnight Bangkok (e.g., "today" computed in UTC) | Medium | Centralize all "today"/"date" computation in `lib/timezone.ts`. Add the clock-freeze test described in Task 3. |
| Supabase free-tier project pause after idle | Low | Out of scope — document in README. |
| Singleton row pattern (`shop_settings.id = 1`) is unusual and may surprise contributors | Low | One-line comment in the migration; `getShopSettings()` always selects `id = 1`. |

## Acceptance
- [ ] Migration applied; `shop_settings` has the seeded row, `closed_dates` exists and is empty.
- [ ] `pnpm lint`, `pnpm build`, and `pnpm vitest run` all pass.
- [ ] Visiting `/admin` without a valid cookie redirects to `/admin/login`.
- [ ] Logging in with the correct password lands on `/admin` and shows current settings.
- [ ] Editing open time, close time, weekly closed day, adding a closed date, and removing a closed date all persist across reload.
- [ ] Invalid input (close ≤ open, weekday out of range, past closed date) surfaces a clear error and does not write.
- [ ] All admin server actions call `requireAdmin()` before any DAL call.
- [ ] No Supabase service-role key is reachable from any Client Component (grep confirms).
- [ ] DAL exports the read functions Milestone 2 will consume: `getShopSettings()`, `listClosedDates({ from, to })`.

## What this milestone deliberately does NOT do
- No customer-facing booking page (Milestone 2).
- No lookup-by-phone page (Milestone 3).
- No `bookings` table — Milestone 2 will add it. Adding it now without a consumer tempts schema drift; better to land it with its first user.
- No password rotation, "forgot password", or 2FA. Single-shop MVP.

---
**WAITING FOR CONFIRMATION**: Proceed with this plan? Reply with:
- `yes` / `proceed` to start implementation (Task 1 first),
- `modify: <change>` to revise,
- or call out anything that should move out of scope to keep this milestone smaller.
