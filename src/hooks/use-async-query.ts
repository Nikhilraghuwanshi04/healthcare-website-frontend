'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncQuery<T> {
  data: T | null;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

interface Settled<T> {
  key: string;
  nonce: number;
  data: T | null;
  error: unknown;
}

/**
 * The one data-loading primitive in the app: tracks loading / success / error
 * for a service call and re-runs whenever `key` changes (filters, ids, pages).
 * `key` is required so callers think about what actually invalidates the query.
 *
 * "Loading" is derived from whether the settled result still matches the
 * requested key/nonce, so the effect only ever calls setState from a promise
 * callback.
 */
export function useAsyncQuery<T>(loader: () => Promise<T>, key: string): AsyncQuery<T> {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let current = true;

    loaderRef.current()
      .then((result) => {
        if (current) setSettled({ key, nonce, data: result, error: null });
      })
      .catch((cause: unknown) => {
        if (current) setSettled({ key, nonce, data: null, error: cause });
      });

    return () => {
      current = false;
    };
  }, [key, nonce]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  const isPending = settled === null || settled.key !== key || settled.nonce !== nonce;

  return {
    data: isPending ? null : settled.data,
    error: isPending ? null : settled.error,
    isLoading: isPending,
    refetch,
  };
}
