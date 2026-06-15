'use client';

import { useEffect, useState } from 'react';

import type { SlotStatus } from '@/lib/booking';

import { fetchSlots } from '../_actions/slots';

export type SlotsState = {
  loading: boolean;
  list: SlotStatus[];
  error: string | null;
};

/**
 * Loads slot statuses for `date` and re-loads whenever it changes. Passing
 * `null` or an empty string disables the lookup.
 *
 * `skipInitialFor` lets the caller seed slots server-side (e.g. for the first
 * paint of the customer booking form) and skip the duplicate client fetch on
 * mount. The hook still re-fetches when the user picks a different date.
 *
 * The no-fetch states (no date, or the server-seeded date) are derived during
 * render, so the effect runs only for the async fetch path — that keeps
 * setState out of the effect's synchronous body and the deps complete.
 *
 * Extracted from the customer and admin booking forms so both share the same
 * loading/error contract — they previously hand-rolled near-identical effects.
 */
export function useSlots(
  date: string | null,
  opts: { initial?: SlotStatus[]; skipInitialFor?: string | null } = {},
): SlotsState {
  const seed = opts.initial ?? [];
  const skipFor = opts.skipInitialFor ?? null;

  // Holds the outcome of the latest fetch, tagged with the date it was for so a
  // stale result is never shown against a newer `date`.
  const [fetched, setFetched] = useState<{ date: string; state: SlotsState } | null>(null);

  useEffect(() => {
    if (!date || date === skipFor) return;

    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchSlots(date);
        if (cancelled) return;
        setFetched({ date, state: { loading: false, list, error: null } });
      } catch (err) {
        if (cancelled) return;
        setFetched({
          date,
          state: {
            loading: false,
            list: [],
            error: err instanceof Error ? err.message : 'Could not load slots',
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date, skipFor]);

  if (!date) return { loading: false, list: [], error: null };
  // Server already rendered this date's slots; trust the seed, no client fetch.
  if (date === skipFor) return { loading: false, list: seed, error: null };
  if (fetched && fetched.date === date) return fetched.state;
  return { loading: true, list: [], error: null };
}
