'use client';

import { useSyncExternalStore } from 'react';

function noSubscriptions(): () => void {
  return () => {};
}

/**
 * False on the server and during hydration, true from the first client render
 * onwards. Lets client-only UI (portals, localStorage-backed sessions) wait for
 * the browser without a round trip through state in an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscriptions, () => true, () => false);
}
