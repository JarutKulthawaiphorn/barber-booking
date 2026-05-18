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
 * Extracted from the customer and admin booking forms so both share the same
 * loading/error contract — they previously hand-rolled near-identical effects.
 */
export function useSlots(
  date: string | null,
  opts: { initial?: SlotStatus[]; skipInitialFor?: string | null } = {},
): SlotsState {
  const seed = opts.initial ?? [];
  const skipFor = opts.skipInitialFor ?? null;

  const [state, setState] = useState<SlotsState>({
    loading: !!date && date !== skipFor,
    list: seed,
    error: null,
  });

  useEffect(() => {
    if (!date) {
      setState({ loading: false, list: [], error: null });
      return;
    }
    if (date === skipFor) {
      // Server already rendered this date's slots; trust the seed.
      setState({ loading: false, list: seed, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    void (async () => {
      try {
        const list = await fetchSlots(date);
        if (cancelled) return;
        setState({ loading: false, list, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          list: [],
          error: err instanceof Error ? err.message : 'Could not load slots',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `seed` and `skipFor` are stable values produced on the server side; we
    // intentionally key only on `date` to avoid re-fetching when the parent
    // re-renders with the same identity-changed seed array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return state;
}
