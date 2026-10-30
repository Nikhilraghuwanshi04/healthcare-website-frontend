import { DOCTORS } from '@/data/doctors';
import { PATIENTS } from '@/data/patients';
import { createSeedAppointments } from '@/data/appointments';
import { delay } from '@/lib/async';
import { toIsoDate } from '@/lib/dates';
import { ServiceError } from '@/lib/errors';
import { MOCK_STORAGE_KEYS, clearStored, readStored, writeStored } from '@/lib/storage';
import type { Appointment } from '@/types/appointment';
import type { Doctor } from '@/types/doctor';
import type { PatientProfile } from '@/types/user';

/**
 * MOCK BACKEND STORE
 * Stands in for the Express + database layer. Everything above this file only
 * ever talks to the typed services, so replacing it means deleting this module.
 *
 * Server note: module state is per runtime instance. Mutations made in the
 * browser persist to localStorage; server renders always read the seed data.
 */

export const MOCK_LATENCY_MS = 140;

export interface MockDatabase {
  doctors: Doctor[];
  patients: PatientProfile[];
  appointments: Appointment[];
}

interface PersistedCollection<T> {
  seededOn: string;
  items: T[];
}

let database: MockDatabase | null = null;

function load<T>(key: string, seed: () => T[]): T[] {
  const stored = readStored<PersistedCollection<T>>(key);
  // The demo seeds itself relative to "today", so a stale day re-seeds cleanly.
  if (!stored || stored.seededOn !== toIsoDate(new Date())) {
    const items = seed();
    save(key, items);
    return items;
  }
  return stored.items;
}

function save<T>(key: string, items: T[]): void {
  writeStored(key, { seededOn: toIsoDate(new Date()), items } satisfies PersistedCollection<T>);
}

export function getDatabase(): MockDatabase {
  if (!database) {
    database = {
      doctors: load(MOCK_STORAGE_KEYS.doctors, () => DOCTORS.map((doctor) => ({ ...doctor }))),
      patients: load(MOCK_STORAGE_KEYS.patients, () => PATIENTS.map((patient) => ({ ...patient }))),
      appointments: load(MOCK_STORAGE_KEYS.appointments, createSeedAppointments),
    };
  }
  return database;
}

export function saveDoctors(): void {
  save(MOCK_STORAGE_KEYS.doctors, getDatabase().doctors);
}

export function savePatients(): void {
  save(MOCK_STORAGE_KEYS.patients, getDatabase().patients);
}

export function saveAppointments(): void {
  save(MOCK_STORAGE_KEYS.appointments, getDatabase().appointments);
}

/** Test helper: forget localStorage state so the next read re-seeds. */
export function resetMockStore(): void {
  database = null;
  clearStored(MOCK_STORAGE_KEYS.doctors);
  clearStored(MOCK_STORAGE_KEYS.patients);
  clearStored(MOCK_STORAGE_KEYS.appointments);
}

export function mockRequest<T>(work: () => T, latencyMs = MOCK_LATENCY_MS): Promise<T> {
  return delay(latencyMs).then(work);
}

/** Mirrors an HTTP error response: resolves after latency, then rejects typed. */
export function mockRejection(error: ServiceError, latencyMs = MOCK_LATENCY_MS): Promise<never> {
  return delay(latencyMs).then(() => {
    throw error;
  });
}
