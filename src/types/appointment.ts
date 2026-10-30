import type { ConsultationMode } from './common';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type CancellationActor = 'patient' | 'doctor' | 'admin';

/**
 * Appointments are denormalised on purpose: mock records must render in lists
 * without extra lookups, and an Express API can return the same shape.
 */
export interface Appointment {
  id: string;
  reference: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialtyName: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  slotId: string;
  startAt: string;
  durationMinutes: number;
  mode: ConsultationMode;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelledBy: CancellationActor | null;
  consultationFeeInr: number;
}

export interface PatientContactDetails {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface CreateAppointmentInput {
  doctorId: string;
  slotId: string;
  patientId: string;
  patient: PatientContactDetails;
  reason: string;
  mode: ConsultationMode;
}

export interface CancelAppointmentInput {
  appointmentId: string;
  reason: string;
  actor: CancellationActor;
}

export type AppointmentSortKey = 'soonest' | 'latest' | 'patient_name';

export interface AppointmentListFilter {
  statuses?: AppointmentStatus[];
  doctorId?: string | null;
  patientId?: string | null;
  search?: string;
  /** ISO date-time bounds. */
  from?: string | null;
  to?: string | null;
  sort?: AppointmentSortKey;
}
