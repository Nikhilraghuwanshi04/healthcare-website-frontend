export const MOCK_STORAGE_KEYS = {
  session: 'medibook.mock.session',
  doctors: 'medibook.mock.doctors',
  patients: 'medibook.mock.patients',
  appointments: 'medibook.mock.appointments',
  registeredAccounts: 'medibook.mock.registered-accounts',
  bookingDraft: 'medibook.mock.booking-draft',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readStored<T>(key: string): T | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted mock state is not recoverable; start from the seed data.
    window.localStorage.removeItem(key);
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStored(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}
