import { SPECIALTIES, specialtyNameOf } from '@/data/specialties';
import { ServiceError } from '@/lib/errors';
import { toDoctorCreateInput, toDoctorProfileUpdate } from './doctor-mappers';
import { createId } from '@/lib/ids';
import type { DoctorProfileValues } from '@/lib/validations/profile';
import type { AdminDoctorFormValues } from '@/lib/validations/admin';
import type { Doctor, DoctorSearchQuery, DoctorSummary } from '@/types/doctor';
import { getDatabase, mockRequest, saveDoctors } from './mock-store';
import { nextAvailableSlotFor } from './slot-service';

export function toDoctorSummary(doctor: Doctor, now: Date): DoctorSummary {
  const nextSlot = nextAvailableSlotFor(doctor, now);
  return {
    id: doctor.id,
    name: doctor.name,
    credentials: doctor.credentials,
    specialtyId: doctor.specialtyId,
    specialtyName: specialtyNameOf(doctor.specialtyId),
    city: doctor.location.city,
    consultationFeeInr: doctor.consultationFeeInr,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    experienceYears: doctor.experienceYears,
    modes: doctor.modes,
    acceptingNewPatients: doctor.acceptingNewPatients,
    nextAvailableSlotAt: nextSlot ? nextSlot.startAt : null,
  };
}

/** Pure so the search / filter / sort contract can be unit tested without a DOM. */
export function filterDoctorSummaries(
  summaries: DoctorSummary[],
  query: DoctorSearchQuery,
): DoctorSummary[] {
  const search = query.search?.trim().toLowerCase() ?? '';

  const matched = summaries.filter((doctor) => {
    if (search) {
      const haystack = `${doctor.name} ${doctor.specialtyName} ${doctor.city}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (query.specialtyId && doctor.specialtyId !== query.specialtyId) return false;
    if (query.city && doctor.city !== query.city) return false;
    if (query.maxFeeInr != null && doctor.consultationFeeInr > query.maxFeeInr) return false;
    if (query.acceptingNewPatientsOnly && !doctor.acceptingNewPatients) return false;
    if (query.modes?.length && !query.modes.every((mode) => doctor.modes.includes(mode))) return false;
    return true;
  });

  switch (query.sort) {
    case 'fee_asc':
      return matched.sort((a, b) => a.consultationFeeInr - b.consultationFeeInr);
    case 'fee_desc':
      return matched.sort((a, b) => b.consultationFeeInr - a.consultationFeeInr);
    case 'experience':
      return matched.sort((a, b) => b.experienceYears - a.experienceYears);
    case 'soonest':
      return matched.sort((a, b) => {
        if (!a.nextAvailableSlotAt) return 1;
        if (!b.nextAvailableSlotAt) return -1;
        return new Date(a.nextAvailableSlotAt).getTime() - new Date(b.nextAvailableSlotAt).getTime();
      });
    case 'rating':
    default:
      return matched.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }
}

/** GET /api/doctors */
export async function listDoctors(query: DoctorSearchQuery = {}): Promise<DoctorSummary[]> {
  const now = new Date();
  return mockRequest(() =>
    filterDoctorSummaries(
      getDatabase().doctors.map((doctor) => toDoctorSummary(doctor, now)),
      query,
    ),
  );
}

/** GET /api/doctors/:id */
export async function getDoctor(doctorId: string): Promise<Doctor> {
  return mockRequest(() => {
    const doctor = getDatabase().doctors.find((candidate) => candidate.id === doctorId);
    if (!doctor) throw new ServiceError('not_found', 'We could not find that doctor profile.');
    return doctor;
  });
}

/** GET /api/specialties */
export async function listSpecialties() {
  return mockRequest(() => SPECIALTIES);
}

/** GET /api/doctors/cities */
export async function listCities(): Promise<string[]> {
  return mockRequest(() =>
    Array.from(new Set(getDatabase().doctors.map((doctor) => doctor.location.city))).sort(),
  );
}

function requireDoctor(doctorId: string): Doctor {
  const doctor = getDatabase().doctors.find((candidate) => candidate.id === doctorId);
  if (!doctor) throw new ServiceError('not_found', 'We could not find that doctor profile.');
  return doctor;
}

/** PATCH /api/doctors/:id — a doctor edits only their own clinic profile. */
export async function updateDoctorProfile(
  doctorId: string,
  values: DoctorProfileValues,
): Promise<Doctor> {
  return mockRequest(() => {
    const database = getDatabase();
    const current = requireDoctor(doctorId);
    const updated: Doctor = { ...current, ...toDoctorProfileUpdate(values) };
    database.doctors[database.doctors.indexOf(current)] = updated;
    saveDoctors();
    return updated;
  });
}

/** POST /api/admin/doctors */
export async function adminCreateDoctor(values: AdminDoctorFormValues): Promise<Doctor> {
  return mockRequest(() => {
    const database = getDatabase();
    const input = toDoctorCreateInput(values);
    const slug = input.name
      .toLowerCase()
      .replace(/^dr\.?\s+/, '')
      .replace(/[^a-z]+/g, '-')
      .replace(/^-|-$/g, '');
    // input.accountEmail is what the backend would provision a login for;
    // the mock store has no accounts table, so the doctor record omits it.
    const doctor: Doctor = {
      id: `dr-${slug}-${createId('x').slice(-4)}`,
      name: input.name,
      credentials: input.credentials,
      specialtyId: input.specialtyId,
      about: input.about,
      highlight: input.highlight,
      languages: input.languages,
      experienceYears: input.experienceYears,
      consultationFeeInr: input.consultationFeeInr,
      modes: input.modes,
      acceptingNewPatients: input.acceptingNewPatients,
      location: input.location,
      availability: input.availability,
      education: ['Certificates pending backend verification'],
      rating: 0,
      reviewCount: 0,
      profileVerifiedAt: null,
    };
    database.doctors.push(doctor);
    saveDoctors();
    return doctor;
  });
}

/** PATCH /api/admin/doctors/:id — admin edits the full record, including identity. */
export async function adminUpdateDoctor(doctorId: string, values: AdminDoctorFormValues): Promise<Doctor> {
  return mockRequest(() => {
    const database = getDatabase();
    const current = requireDoctor(doctorId);
    const updated: Doctor = { ...current, ...toDoctorCreateInput(values) };
    database.doctors[database.doctors.indexOf(current)] = updated;
    saveDoctors();
    return updated;
  });
}

/** PATCH /api/admin/doctors/:id/verification */
export async function adminSetDoctorVerified(doctorId: string, verified: boolean): Promise<Doctor> {
  return mockRequest(() => {
    const database = getDatabase();
    const current = requireDoctor(doctorId);
    const updated: Doctor = { ...current, profileVerifiedAt: verified ? new Date().toISOString() : null };
    database.doctors[database.doctors.indexOf(current)] = updated;
    saveDoctors();
    return updated;
  });
}
