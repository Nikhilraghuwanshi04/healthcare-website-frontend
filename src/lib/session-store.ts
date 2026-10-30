import { MOCK_STORAGE_KEYS, clearStored, readStored, writeStored } from './storage';
import type { MockSession } from '@/types/user';

/**
 * localStorage-backed holder for the mock session, shaped for useSyncExternalStore.
 * getSnapshot has to return the same object while the value is unchanged, so the
 * parsed record is cached and compared by its serialised form.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let cachedKey: string | null = null;
let cachedSession: MockSession | null = null;

function serialise(session: MockSession | null): string | null {
  return session === null ? null : JSON.stringify(session);
}

export function getSessionSnapshot(): MockSession | null {
  const session = readStored<MockSession>(MOCK_STORAGE_KEYS.session);
  const key = serialise(session);
  if (key === cachedKey) return cachedSession;

  cachedKey = key;
  cachedSession = session;
  return cachedSession;
}

export function getSessionSnapshotOnServer(): MockSession | null {
  return null;
}

export function subscribeToSession(onChange: Listener): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function persistSession(session: MockSession | null): void {
  if (session === null) {
    clearStored(MOCK_STORAGE_KEYS.session);
  } else {
    writeStored(MOCK_STORAGE_KEYS.session, session);
  }
  for (const listener of Array.from(listeners)) listener();
}
