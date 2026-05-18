-- Migration 002 — customer_name, barber_name, allow "open every day"
--
-- Apply via Supabase SQL editor or `psql`. Safe to re-run thanks to IF [NOT] EXISTS guards.

-- 1. customer_name on bookings (required going forward, '—' backfilled for existing rows)
alter table public.bookings
  add column if not exists customer_name text not null default '—';

alter table public.bookings
  alter column customer_name drop default;

alter table public.bookings
  add constraint bookings_customer_name_len_chk
    check (char_length(btrim(customer_name)) between 1 and 24)
    not valid;

alter table public.bookings validate constraint bookings_customer_name_len_chk;

-- 2. barber_name on bookings (nullable; only set when admin creates the booking)
alter table public.bookings
  add column if not exists barber_name text null;

alter table public.bookings
  add constraint bookings_barber_name_len_chk
    check (barber_name is null or char_length(btrim(barber_name)) between 1 and 24)
    not valid;

alter table public.bookings validate constraint bookings_barber_name_len_chk;

-- 3. Allow "open every day" by letting weekly_closed_weekday be NULL
alter table public.shop_settings
  alter column weekly_closed_weekday drop not null;
