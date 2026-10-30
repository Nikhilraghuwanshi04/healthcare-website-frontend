import type { ClinicLocation, ConsultationMode, WeeklyAvailability } from './common';

export interface Specialty {
  id: string;
  name: string;
  description: string;
}

export interface Doctor {
  id: string;
  name: string;
  /** e.g. "MBBS, MD, DM (Cardiology)" */
  credentials: string;
  specialtyId: string;
  about: string;
  highlight: string;
  education: string[];
  languages: string[];
  experienceYears: number;
  consultationFeeInr: number;
  rating: number;
  reviewCount: number;
  location: ClinicLocation;
  modes: ConsultationMode[];
  availability: WeeklyAvailability;
  acceptingNewPatients: boolean;
  /** ISO date-time the profile was last verified by an administrator. */
  profileVerifiedAt: string | null;
}

export interface DoctorSummary {
  id: string;
  name: string;
  credentials: string;
  specialtyId: string;
  specialtyName: string;
  city: string;
  consultationFeeInr: number;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  modes: ConsultationMode[];
  acceptingNewPatients: boolean;
  nextAvailableSlotAt: string | null;
}

/** `closed` = not bookable (already elapsed or inside the mock lead-time window). */
export type SlotStatus = 'available' | 'booked' | 'closed';

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  /** ISO date-time with timezone offset. */
  startAt: string;
  durationMinutes: number;
  status: SlotStatus;
}

export type DoctorSortKey = 'rating' | 'fee_asc' | 'fee_desc' | 'experience' | 'soonest';

/** Command shapes the UI sends; mirrors the future Express request bodies. */
export interface DoctorProfileUpdate {
  about: string;
  highlight: string;
  languages: string[];
  consultationFeeInr: number;
  modes: ConsultationMode[];
  acceptingNewPatients: boolean;
  location: ClinicLocation;
  availability: WeeklyAvailability;
}

export interface DoctorCreateInput extends DoctorProfileUpdate {
  name: string;
  credentials: string;
  specialtyId: string;
  experienceYears: number;
  accountEmail: string;
}

export interface DoctorSearchQuery {
  search?: string;
  specialtyId?: string | null;
  city?: string | null;
  maxFeeInr?: number | null;
  modes?: ConsultationMode[];
  acceptingNewPatientsOnly?: boolean;
  sort?: DoctorSortKey;
}
