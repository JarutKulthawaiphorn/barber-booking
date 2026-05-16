---
status: draft
awaiting: user-confirmation
---

# Plan: Customer can book a slot

**Source PRD**: `.claude/prds/barber-booking.prd.md`
**Selected Milestone**: #2 — Customer can book a slot
**Complexity**: Medium — first customer-facing write path; introduces the `bookings` table and the slot-availability computation that the lookup milestone will reuse for read.

## Summary
Add a public booking flow at `/book`. The visitor enters a Thai phone number, picks a date within today → today + 13 days (Asia/Bangkok), and picks a 30-minute time slot inside open/close. The date picker hides the weekly closed weekday and any one-off closed date; the time dropdown hides slots already booked. Submission writes one row to a new `bookings` table guarded by a unique constraint on `(booked_on, slot_time)` so a race produces a clean conflict error rather than a double-book.

## Decisions locked in this planning round
| PRD open question | Decision for MVP | Reasoning |
|---|---|---|
| Phone format | Thai mobile only: `^0[6-9]\d{8}$` (10 digits, leading 0, second digit 6/8/9). Stored normalized as `0XXXXXXXXX`. | Single Thai shop; international can be added later without a data migration. |
| Already-has-a-booking rule | Cap at **one active future booking per phone**. Active = `booked_on >= today_in_bangkok`. | Prevents one customer from blocking the whole day; reschedule = lookup + (manual for now). |
| Slot concurrency | DB unique constraint on `(booked_on, slot_time)` + insert-then-handle-`23505`. No advisory locks. | Single-chair model = one slot per timestamp. Constraint is correct under any race. |
| Slot length | Fixed 30 minutes, aligned on the half hour from `open_time`. | PRD §Scope. |
| Lookahead window | Today through today + 13 days (14 days inclusive). | PRD §Scope. |
| Language | English-only public copy in MVP. | Matches admin UI; localization is a Milestone-4 concern. |
| Enumeration / rate-limit | Out of scope for the **write** path — write requires phone + valid future slot, which is naturally narrow. Lookup hardening lives in Milestone 3. | Keeps this milestone tight. |

These resolve every PRD open question except retention (org-policy decision, not a code task) and rate-limiting (Milestone 3).

## Patterns to Mirror
Established by Milestone 1 — mirror exactly:

| Category | Source | Pattern |
|---|---|---|
| DAL shape | `lib/shop-settings.ts:24-46` | Export `validateX(input)` separately; DAL functions return narrow plain objects, never raw Supabase rows. |
| DAL error style | `lib/shop-settings.ts:122-125` | Throw `Error` with stable plain-English message; map Postgres `23505` to a user-facing "already taken" string at the DAL boundary. |
| Time/date helpers | `lib/timezone.ts:1-16` | All "today" / date math goes through `lib/timezone.ts` — no `new Date()` in feature code. |
| Server actions | `app/admin/actions.ts:1-32` | Top-of-file `'use server'`. On error: `redirect('/book?error=<msg>')`. On success: `redirect('/book/confirmed?id=<uuid>')`. No `revalidatePath` needed for the booking write because the slot list is computed per-request. |
| Form/page split | `app/admin/page.tsx` + `app/admin/login/page.tsx` | Server component reads data, renders a `<form action={serverAction}>`. Use `searchParams: Promise<{…}>` and `await` it. |
| Tests | `lib/shop-settings.test.ts`, `lib/timezone.test.ts` | Co-located `*.test.ts` with Vitest; cover validation + each error branch + happy path. |
| Auth boundary | `lib/auth.ts:127-131` | `/book/*` is **public** — do NOT call `requireAdmin()`. `/admin/*` is the only authenticated surface. |
| Supabase access | `lib/supabase/server.ts` (via `getSupabase()`) | Service-role client; only imported from server modules. |

What's new (sets the pattern for Milestone 3): the **slot availability** computation. Lives in `lib/booking.ts` as a pure function `availableSlots({ settings, closedDates, existingBookings, date, today })` so it's unit-testable without a database.

## Data Model

One new table. `slot_time` is the start of the half-hour slot; the implicit end is `slot_time + 30 min`.

```sql
-- supabase/migrations/0002_init_bookings.sql

create table bookings (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^0[6-9][0-9]{8}$'),
  booked_on date not null,
  slot_time time not null,
  created_at timestamptz not null default now(),
  -- One booking per (date, slot). Race → 23505.
  constraint bookings_slot_unique unique (booked_on, slot_time)
);

-- Lookup-by-phone (Milestone 3 will use this; harmless to land now).
create index bookings_phone_idx on bookings (phone);

-- Today-or-later scans for slot availability and the active-booking cap.
create index bookings_booked_on_idx on bookings (booked_on);
```

**Validation rules** (enforced in `lib/booking.ts`, mirrored at DB level where possible):
- `phone` matches `^0[6-9]\d{8}$` after trimming spaces and dashes.
- `booked_on` is in `[today_bangkok, today_bangkok + 13 days]`.
- `booked_on` is not the weekly closed weekday and not in `closed_dates`.
- `slot_time` is a 30-minute multiple, `>= open_time`, and `+ 30 min <= close_time`.
- No existing booking with this phone where `booked_on >= today_bangkok` (active-booking cap).

## Files to Change

| File | Action | Why |
|---|---|---|
| `supabase/migrations/0002_init_bookings.sql` | CREATE | New `bookings` table + indexes. Applied via Supabase MCP `apply_migration`. |
| `lib/booking.ts` | CREATE | DAL + pure helpers: `normalizePhone`, `validatePhone`, `enumerateSlots(open, close)`, `availableSlots({…})`, `listBookableDates({…})`, `createBooking(input)`, `getBookingById(id)`. |
| `lib/booking.test.ts` | CREATE | Vitest: phone normalization/validation, slot enumeration edge cases (close-on-half-hour, sub-30-min remainder), date-window math across midnight Bangkok, conflict mapping. |
| `app/book/page.tsx` | CREATE | Public server component. Reads shop settings + closed dates + today's bookings, renders the booking form. `searchParams` carry `?error=` flash + optional `?date=YYYY-MM-DD` to pre-select. |
| `app/book/actions.ts` | CREATE | `createBookingAction(formData)` — normalize phone, call `createBooking`, redirect to `/book/confirmed?id=…` on success or `/book?error=…` on failure. |
| `app/book/confirmed/page.tsx` | CREATE | Server component. Reads `?id=`, calls `getBookingById`, renders phone (masked last 4 visible), date, time, and a "Book another" link. 404 if id unknown. |
| `app/book/_components/booking-form.tsx` | CREATE | Client component. Date `<select>` (only bookable dates), time `<select>` (slots for the selected date, fetched via a tiny route handler — see below), phone input with `inputMode="numeric"` and live format. |
| `app/api/slots/route.ts` | CREATE | `GET /api/slots?date=YYYY-MM-DD` → JSON `{ slots: string[] }`. Recomputes availability server-side so the dropdown stays correct as other customers book. Public, no auth. |
| `app/page.tsx` | UPDATE | The existing "Book an appointment" link is currently a stub — point it at `/book` (it likely already does; verify). |
| `.env.local.example` | NO CHANGE | No new env vars. |

## Tasks

### Task 1: Migration
- **Action**: Write `supabase/migrations/0002_init_bookings.sql` per schema above. Apply via Supabase MCP `apply_migration`.
- **Mirror**: Migration naming convention from `0001_init_shop_settings.sql`.
- **Validate**: Supabase MCP `list_tables` shows `bookings` with the unique constraint and both indexes; manual `insert` then `insert` again with same `(booked_on, slot_time)` returns `23505`.

### Task 2: Pure helpers (TDD)
- **Action**: Implement `normalizePhone`, `validatePhone`, `enumerateSlots(openHHMM, closeHHMM)`, and the pure `availableSlots({ settings, closedDates, existingBookings, date, today })` function in `lib/booking.ts`. Write tests **first** in `lib/booking.test.ts`.
- **Mirror**: `lib/shop-settings.ts` separation of pure validators from async DAL.
- **Validate**: `pnpm vitest run lib/booking.test.ts` green. Tests cover:
  - phone: accepts `0812345678`, `081-234-5678`, `081 234 5678`; rejects `0512345678`, `812345678`, `081234567`, empty.
  - slots: `09:00`–`19:00` produces 20 slots starting `09:00`, ending `18:30`; `09:00`–`19:15` still produces 20 slots (drops the partial); `09:00`–`09:30` produces 1 slot.
  - availability: weekly closed weekday → empty; closed date → empty; conflicting booking removed from list; out-of-window date → empty.
  - date-window: clock frozen at `2026-05-16T17:30:00Z` → `listBookableDates` first entry is `2026-05-17`, last entry is `2026-05-30` (14 entries minus any closed days).

### Task 3: DAL (createBooking, getBookingById, listBookingsOnDate)
- **Action**: Implement async DAL functions in `lib/booking.ts`. `createBooking` validates → loads shop settings + closed dates + bookings for that date + active-booking-count for that phone → inserts. Maps Postgres `23505` on `bookings_slot_unique` to `Error('That slot was just taken — please pick another')`. Maps phone CHECK violation to `Error('Phone number must be a Thai mobile (10 digits, starting 06/08/09)')`.
- **Mirror**: `addClosedDate` 23505 handling at `lib/shop-settings.ts:122-125`.
- **Validate**: Vitest covers happy path, each validation rule, the active-booking cap, and the conflict mapping (insert twice with same key — assert the user-facing string).

### Task 4: Slots API route
- **Action**: `app/api/slots/route.ts` exports `GET`. Validates `date` query param (regex + bookable-window check). Calls `availableSlots(…)` and returns `{ slots: ['09:00', '09:30', …] }`. Returns `400` with `{ error: '…' }` on bad input. No auth.
- **Mirror**: First route handler in repo — establishes the pattern: validate query → call DAL → return narrow JSON. Read `node_modules/next/dist/docs/01-app/03-api-reference/02-file-conventions/route.md` before writing.
- **Validate**: `curl http://localhost:3000/api/slots?date=2026-05-17` returns a slot array. `?date=2030-01-01` (out of window) returns `400`. `?date=garbage` returns `400`. Booking a slot via SQL then re-hitting the endpoint shows that slot gone.

### Task 5: Booking form page
- **Action**: `app/book/page.tsx` (server) renders the form. Pre-computes `listBookableDates` and the slot list for the initially-selected date so first paint has options without a client fetch. `app/book/_components/booking-form.tsx` (client) handles the live "when date changes, refetch /api/slots" behavior. `app/book/actions.ts` exports `createBookingAction`.
- **Mirror**: `app/admin/page.tsx` server-renders + `app/admin/login/page.tsx` form structure + `app/admin/actions.ts` error/success redirect pattern.
- **Validate**: Manual — load `/book` on a known-closed weekday, confirm that date is not in the dropdown. Pick a date, confirm slots load. Submit invalid phone → bounced back with `?error=`. Submit valid → lands on `/book/confirmed?id=…`.

### Task 6: Confirmation page
- **Action**: `app/book/confirmed/page.tsx` reads `?id=` from `searchParams` (Promise), calls `getBookingById`, renders a small card with phone (mask format `081-XXX-5678`), date, and slot time. Includes a "Book another appointment" link to `/book`. Renders `notFound()` if the id is unknown or malformed.
- **Mirror**: `app/admin/page.tsx` for the await-searchParams pattern.
- **Validate**: Manual — visit `/book/confirmed?id=<real>` shows details; `/book/confirmed?id=00000000-0000-0000-0000-000000000000` 404s.

### Task 7: Wire landing page (verification)
- **Action**: Confirm `app/page.tsx` "Book an appointment" link points to `/book`. If it 404s today, leave unchanged — it'll now resolve.
- **Validate**: Click-through from `/` to `/book` and back works.

## Validation
```bash
pnpm install
pnpm lint
pnpm build
pnpm vitest run

# Manual smoke (with `.env.local` populated):
pnpm dev
# 1. Visit http://localhost:3000/book on a weekday that's NOT the weekly closed day.
# 2. Pick a date 3 days out, confirm slots appear, pick one, enter 081-234-5678.
# 3. Submit → land on /book/confirmed?id=… → see the booking.
# 4. Try to book the SAME slot in a second browser → see "That slot was just taken".
# 5. Try to book a SECOND future slot with the same phone → see active-booking cap error.
# 6. Add a closed date in /admin for tomorrow → reload /book → tomorrow is gone from dropdown.
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Slot dropdown goes stale between page render and submit, customer thinks they got a slot but the action fails | Medium | Server action is the source of truth; 23505 mapping yields a clean message and bounces back with `?error=` so they can pick another. The `/api/slots` route exists specifically so the client can refresh without a full reload. |
| Phone validation regex rejects a legitimate Thai number (e.g., new operator prefix) | Low–Medium | Pattern documented in code with a comment naming the prefixes; easy to widen. Validation lives in one place (`validatePhone`). |
| `Intl.DateTimeFormat` quirks at the Bangkok midnight boundary cause `listBookableDates` to be off-by-one | Medium | Reuse `todayInBangkok()` from `lib/timezone.ts` — already covered by `lib/timezone.test.ts`. Add an additional booking-specific test at `2026-05-16T16:59:59Z` (just before midnight Bangkok) and `T17:00:00Z` (exactly midnight). |
| Concurrent booking race | Low (low volume) | DB unique constraint is the only correct fix and is already in the migration. |
| Public POST is open to spam/abuse | Medium | Out of scope for write path per locked decisions, but log all `createBooking` errors so we can spot a pattern. If abuse appears post-launch, add a Turnstile/captcha pass — non-blocking for MVP. |
| Active-booking cap check is racy (TOCTOU between count and insert) | Low | Acceptable in MVP — worst case is one customer ends up with two future bookings. A composite unique index on `(phone, ...)` would over-restrict legitimate use after cancellation lands post-MVP. |
| The `/api/slots` route handler is the first non-Next-15 file — API surface may have moved | Medium | Read `node_modules/next/dist/docs/01-app/03-api-reference/02-file-conventions/route.md` before writing (per `AGENTS.md`). |

## Acceptance
- [ ] Migration `0002_init_bookings.sql` applied; `bookings` table visible with unique constraint and both indexes.
- [ ] `pnpm lint`, `pnpm build`, `pnpm vitest run` all green.
- [ ] `/book` renders on a public (unauthenticated) browser and does not redirect to `/admin/login`.
- [ ] Date dropdown shows 14 dates minus the weekly closed weekday and any one-off closed dates inside the window.
- [ ] Time dropdown shows only 30-minute slots inside open/close, and a slot already in `bookings` for that date is hidden.
- [ ] Submitting a valid booking lands on `/book/confirmed?id=…` and the row exists in `bookings`.
- [ ] Submitting a duplicate `(date, slot)` yields a user-visible "already taken" message, no DB row.
- [ ] Submitting a second future booking with the same phone yields the active-booking cap message.
- [ ] Invalid phone formats are rejected with a clear message before reaching the DB.
- [ ] `GET /api/slots?date=…` returns the same slot list the server-rendered dropdown shows.
- [ ] The admin pages are still gated and unaffected (smoke `/admin` still requires login).
- [ ] DAL exports the read functions Milestone 3 will consume: `getBookingsByPhone(phone)` — add this stub now (tested, not yet UI-consumed) so Milestone 3 doesn't reopen this file.

## What this milestone deliberately does NOT do
- No lookup-by-phone page (Milestone 3).
- No cancellation, reschedule, or status workflow.
- No notifications.
- No admin-side booking creation.
- No language switcher.
- No rate-limiting on the lookup path (deferred to Milestone 3).
- No retention/PII expiration policy in code (org decision, deferred).

---
**WAITING FOR CONFIRMATION**: Proceed with this plan? Reply with:
- `yes` / `proceed` to start implementation (Task 1 first),
- `modify: <change>` to revise (e.g., loosen phone regex, allow N active bookings, change slot length),
- or call out anything that should move out of scope.
