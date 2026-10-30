'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import { useHydrated } from '@/hooks/use-hydrated';
import {
  getSessionSnapshot,
  getSessionSnapshotOnServer,
  subscribeToSession,
} from '@/lib/session-store';
import type { SignInValues, SignUpValues } from '@/lib/validations/auth';
import type { MockSession } from '@/types/user';
import {
  renameSession,
  signIn as mockSignIn,
  signOut as mockSignOut,
  signUp as mockSignUp,
} from '@/services/auth-service';

type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

interface SessionApi {
  status: SessionStatus;
  session: MockSession | null;
  /** The mock patient record id, once a patient is signed in. */
  patientId: string | null;
  doctorId: string | null;
  signIn: (values: SignInValues) => Promise<MockSession>;
  signUp: (values: SignUpValues) => Promise<MockSession>;
  signOut: () => void;
  /** Keeps the header name in sync after a profile edit. */
  rename: (displayName: string) => void;
}

const SessionContext = createContext<SessionApi | null>(null);

/** MOCK AUTHENTICATION: the session is a localStorage record, not a real login. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeToSession, getSessionSnapshot, getSessionSnapshotOnServer);
  const hydrated = useHydrated();

  const value: SessionApi = {
    status: hydrated ? (session ? 'signed-in' : 'signed-out') : 'loading',
    session,
    patientId: session?.role === 'patient' ? session.userId : null,
    doctorId: session?.role === 'doctor' ? session.doctorId : null,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    rename: renameSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>.');
  return context;
}
