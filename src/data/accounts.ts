import type { UserRole } from '@/types/common';

/**
 * MOCK AUTH FIXTURES — not secrets. These strings exist so the demo flow can
 * be exercised without a backend, and they are removed the moment the Express
 * `/api/auth/session` endpoint replaces `services/auth-service.ts`.
 * Never send or compare real credentials from the frontend.
 */
export const MOCK_PASSWORD = 'demo1234';

export interface MockAccount {
  email: string;
  role: UserRole;
  displayName: string;
  patientId: string | null;
  doctorId: string | null;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'patient@demo.medibook.local',
    role: 'patient',
    displayName: 'Riya Sharma',
    patientId: 'pta-riya-sharma',
    doctorId: null,
  },
  {
    email: 'doctor@demo.medibook.local',
    role: 'doctor',
    displayName: 'Dr. Ananya Iyer',
    patientId: null,
    doctorId: 'dr-ananya-iyer',
  },
  {
    email: 'dr-rahul@demo.medibook.local',
    role: 'doctor',
    displayName: 'Dr. Rahul Deshmukh',
    patientId: null,
    doctorId: 'dr-rahul-deshmukh',
  },
  {
    email: 'admin@demo.medibook.local',
    role: 'admin',
    displayName: 'Priya Menon',
    patientId: null,
    doctorId: null,
  },
];

export function findAccountByEmail(email: string): MockAccount | undefined {
  const normalised = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((account) => account.email === normalised);
}
