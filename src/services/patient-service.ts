import { createId } from '@/lib/ids';
import { ServiceError } from '@/lib/errors';
import type { PatientProfileValues } from '@/lib/validations/profile';
import type { SignUpValues } from '@/lib/validations/auth';
import type { PatientProfile } from '@/types/user';
import { getDatabase, mockRequest, savePatients } from './mock-store';

/** Flat form fields map to the nested profile shape the API will store. */
export function toPatientProfile(values: PatientProfileValues, id: string): PatientProfile {
  const emergencyProvided = values.emergencyName || values.emergencyPhone || values.emergencyRelation;
  return {
    id,
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    bloodGroup: values.bloodGroup === 'unknown' ? null : values.bloodGroup,
    address: {
      line1: values.addressLine1,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
    },
    emergencyContact: emergencyProvided
      ? {
          name: values.emergencyName,
          phone: values.emergencyPhone,
          relation: values.emergencyRelation,
        }
      : null,
  };
}

export function toPatientProfileFormValues(patient: PatientProfile): PatientProfileValues {
  return {
    fullName: patient.fullName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup ?? 'unknown',
    addressLine1: patient.address.line1,
    addressLine2: '',
    city: patient.address.city,
    state: patient.address.state,
    postalCode: patient.address.postalCode,
    emergencyName: patient.emergencyContact?.name ?? '',
    emergencyPhone: patient.emergencyContact?.phone ?? '',
    emergencyRelation: patient.emergencyContact?.relation ?? '',
  };
}

/** GET /api/patients */
export async function listPatients(): Promise<PatientProfile[]> {
  return mockRequest(() => [...getDatabase().patients]);
}

/** GET /api/patients/:id */
export async function getPatient(patientId: string): Promise<PatientProfile> {
  return mockRequest(() => {
    const patient = getDatabase().patients.find((candidate) => candidate.id === patientId);
    if (!patient) throw new ServiceError('not_found', 'We could not find that patient record.');
    return patient;
  });
}

/** PATCH /api/patients/:id */
export async function updatePatientProfile(
  patientId: string,
  values: PatientProfileValues,
): Promise<PatientProfile> {
  return mockRequest(() => {
    const database = getDatabase();
    const index = database.patients.findIndex((candidate) => candidate.id === patientId);
    if (index === -1) throw new ServiceError('not_found', 'We could not find that patient record.');
    const duplicate = database.patients.some(
      (patient, position) => position !== index && patient.email === values.email.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new ServiceError('conflict', 'Another account already uses that email address.');
    }

    const updated = toPatientProfile(values, patientId);
    database.patients[index] = updated;
    savePatients();
    return updated;
  });
}

/**
 * POST /api/auth/register (MOCK)
 * Creates a patient record in the mock store so sign-up → sign-out → sign-in
 * can be exercised end to end without a backend.
 */
export async function createPatientFromSignUp(values: SignUpValues): Promise<PatientProfile> {
  return mockRequest(() => {
    const database = getDatabase();
    const email = values.email.trim().toLowerCase();
    if (database.patients.some((patient) => patient.email === email)) {
      throw new ServiceError('conflict', 'An account with that email already exists.');
    }

    const patient: PatientProfile = {
      id: createId('pta'),
      fullName: values.fullName,
      email,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      bloodGroup: null,
      address: { line1: '', city: '', state: '', postalCode: '' },
      emergencyContact: null,
    };
    database.patients.push(patient);
    savePatients();
    return patient;
  });
}
