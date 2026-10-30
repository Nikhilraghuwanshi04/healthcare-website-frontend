import { MOCK_STORAGE_KEYS, clearStored, readStored, writeStored } from '@/lib/storage';
import type { BookingDetailsValues } from '@/lib/validations/booking';
import type { ConsultationMode } from '@/types/common';
import type { PatientProfile } from '@/types/user';

export type BookingStep = 'doctor' | 'slot' | 'details' | 'review' | 'confirmation';

export const STEP_ORDER: BookingStep[] = ['doctor', 'slot', 'details', 'review'];

export const STEP_LABEL: Record<BookingStep, string> = {
  doctor: 'Doctor',
  slot: 'Date & time',
  details: 'Patient details',
  review: 'Review',
  confirmation: 'Booked',
};

export interface BookingSelection {
  doctorId: string;
  slotId: string;
  mode: ConsultationMode;
}

export interface BookingDraft {
  step: BookingStep;
  selection: BookingSelection;
  /** Null until the patient edits the step, so the profile can prefill it. */
  details: BookingDetailsValues | null;
}

export const EMPTY_SELECTION: BookingSelection = { doctorId: '', slotId: '', mode: 'in_person' };

export const EMPTY_DETAILS: BookingDetailsValues = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'prefer_not_to_say',
  reason: '',
};

export const EMPTY_DRAFT: BookingDraft = { step: 'doctor', selection: EMPTY_SELECTION, details: null };

/** The signed-in profile seeds step 3; the reason is always typed fresh. */
export function bookingDetailsFromProfile(patient: PatientProfile): BookingDetailsValues {
  return {
    fullName: patient.fullName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    reason: '',
  };
}

/**
 * The draft survives a reload so a half-finished booking is not lost. It is
 * demo state in localStorage, cleared when the booking is confirmed.
 */
export function readBookingDraft(): BookingDraft | null {
  return readStored<BookingDraft>(MOCK_STORAGE_KEYS.bookingDraft);
}

export function writeBookingDraft(draft: BookingDraft): void {
  writeStored(MOCK_STORAGE_KEYS.bookingDraft, draft);
}

export function clearBookingDraft(): void {
  clearStored(MOCK_STORAGE_KEYS.bookingDraft);
}

export function stepIndexOf(step: BookingStep): number {
  return STEP_ORDER.indexOf(step);
}
