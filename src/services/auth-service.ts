import { MOCK_ACCOUNTS, MOCK_PASSWORD, findAccountByEmail, type MockAccount } from '@/data/accounts';
import { ServiceError } from '@/lib/errors';
import { getSessionSnapshot, persistSession } from '@/lib/session-store';
import { MOCK_STORAGE_KEYS, clearStored, readStored, writeStored } from '@/lib/storage';
import type { SignUpValues, SignInValues } from '@/lib/validations/auth';
import type { MockSession } from '@/types/user';
import { createPatientFromSignUp } from './patient-service';

/**
 * MOCK AUTHENTICATION — there is no server here.
 * Credentials are demo fixtures, and the "session" is a plain localStorage
 * record that only decides which screens the UI renders. Real authentication
 * must come from the Express backend (httpOnly session cookie); delete this
 * file when that lands.
 */

type RegisteredAccount = MockAccount & { password: string };

function normalise(email: string): string {
  return email.trim().toLowerCase();
}

function registeredAccounts(): RegisteredAccount[] {
  return readStored<RegisteredAccount[]>(MOCK_STORAGE_KEYS.registeredAccounts) ?? [];
}

function findCredential(email: string): RegisteredAccount | undefined {
  const seeded = findAccountByEmail(normalise(email));
  if (seeded) return { ...seeded, password: MOCK_PASSWORD };
  return registeredAccounts().find((account) => account.email === normalise(email));
}

function buildSession(account: MockAccount): MockSession {
  return {
    userId: account.patientId ?? account.doctorId ?? account.email,
    role: account.role,
    displayName: account.displayName,
    email: account.email,
    doctorId: account.doctorId,
    startedAt: new Date().toISOString(),
  };
}

export function restoreSession(): MockSession | null {
  return getSessionSnapshot();
}

/** POST /api/auth/session */
export async function signIn(input: SignInValues): Promise<MockSession> {
  const credential = findCredential(input.email);
  const passwordMatches = credential && credential.password === input.password;

  if (!credential || !passwordMatches) {
    throw await rejectUnauthorized();
  }

  const session = buildSession(credential);
  persistSession(session);
  return session;
}

function rejectUnauthorized(): Promise<never> {
  return Promise.reject(
    new ServiceError('unauthorized', 'Mock sign-in failed: no demo account matches that email and password.'),
  );
}

/** POST /api/auth/register */
export async function signUp(input: SignUpValues): Promise<MockSession> {
  const patient = await createPatientFromSignUp(input);
  const account: RegisteredAccount = {
    email: patient.email,
    role: 'patient',
    displayName: patient.fullName,
    patientId: patient.id,
    doctorId: null,
    password: input.password,
  };

  const next = [...registeredAccounts(), account];
  writeStored(MOCK_STORAGE_KEYS.registeredAccounts, next);

  const session = buildSession(account);
  persistSession(session);
  return session;
}

export function signOut(): void {
  persistSession(null);
  clearStored(MOCK_STORAGE_KEYS.bookingDraft);
}

/** Keeps the demo session name in step with an edited profile. */
export function renameSession(displayName: string): void {
  const current = getSessionSnapshot();
  if (!current) return;
  persistSession({ ...current, displayName });
}

/** Demo hints for the sign-in screen. Emails only — the password is a shared fixture. */
export const DEMO_ACCOUNT_HINTS = MOCK_ACCOUNTS.map((account) => ({
  role: account.role,
  email: account.email,
  displayName: account.displayName,
}));
