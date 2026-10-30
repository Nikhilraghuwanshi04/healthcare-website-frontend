import type { BloodGroup, UserRole } from './common';
import type { PatientContactDetails } from './appointment';

export interface Address {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface PatientProfile extends PatientContactDetails {
  id: string;
  bloodGroup: BloodGroup | null;
  address: Address;
  emergencyContact: EmergencyContact | null;
}

export interface DoctorAccount {
  id: string;
  doctorId: string;
  email: string;
  name: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
}

/** Stored in localStorage by the mock session service. Never a real credential. */
export interface MockSession {
  userId: string;
  role: UserRole;
  displayName: string;
  email: string;
  doctorId: string | null;
  startedAt: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}
