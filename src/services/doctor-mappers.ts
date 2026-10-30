import { MOCK_ACCOUNTS } from '@/data/accounts';
import { splitLanguages, type DoctorProfileValues } from '@/lib/validations/profile';
import type { AdminDoctorFormValues } from '@/lib/validations/admin';
import type { Doctor, DoctorCreateInput, DoctorProfileUpdate } from '@/types/doctor';
import type { WeeklyAvailability, WeeklyDayWindow } from '@/types/common';

export function buildAvailability(
  form: Pick<DoctorProfileValues, 'weekdays' | 'dayStart' | 'dayEnd' | 'slotMinutes'>,
): WeeklyAvailability {
  const window: WeeklyDayWindow = {
    start: form.dayStart,
    end: form.dayEnd,
    slotMinutes: form.slotMinutes,
  };
  return {
    0: form.weekdays.includes(0) ? window : null,
    1: form.weekdays.includes(1) ? window : null,
    2: form.weekdays.includes(2) ? window : null,
    3: form.weekdays.includes(3) ? window : null,
    4: form.weekdays.includes(4) ? window : null,
    5: form.weekdays.includes(5) ? window : null,
    6: form.weekdays.includes(6) ? window : null,
  };
}

/** Reconstructs form values from a doctor record for edit screens. */
export function readAvailability(doctor: Doctor): Pick<DoctorProfileValues, 'weekdays' | 'dayStart' | 'dayEnd' | 'slotMinutes'> {
  const entries = Object.values(doctor.availability).filter(Boolean) as WeeklyDayWindow[];
  const window = entries[0];
  return {
    weekdays: Object.entries(doctor.availability)
      .filter(([, value]) => value !== null)
      .map(([day]) => Number(day)),
    dayStart: window?.start ?? '10:00',
    dayEnd: window?.end ?? '17:00',
    slotMinutes: window?.slotMinutes ?? 30,
  };
}

export function toDoctorProfileUpdate(values: DoctorProfileValues): DoctorProfileUpdate {
  return {
    about: values.about,
    highlight: values.highlight,
    languages: splitLanguages(values.languagesText),
    consultationFeeInr: values.consultationFeeInr,
    modes: values.modes,
    acceptingNewPatients: values.acceptingNewPatients,
    location: {
      clinicName: values.clinicName,
      addressLine: values.addressLine,
      city: values.city,
    },
    availability: buildAvailability(values),
  };
}

export function toDoctorCreateInput(values: AdminDoctorFormValues): DoctorCreateInput {
  return {
    name: values.name,
    credentials: values.credentials,
    specialtyId: values.specialtyId,
    experienceYears: values.experienceYears,
    accountEmail: values.accountEmail,
    ...toDoctorProfileUpdate(values),
  };
}

export function doctorToProfileFormValues(doctor: Doctor): DoctorProfileValues {
  return {
    about: doctor.about,
    highlight: doctor.highlight,
    languagesText: doctor.languages.join(', '),
    consultationFeeInr: doctor.consultationFeeInr,
    modes: doctor.modes,
    acceptingNewPatients: doctor.acceptingNewPatients,
    clinicName: doctor.location.clinicName,
    addressLine: doctor.location.addressLine,
    city: doctor.location.city,
    ...readAvailability(doctor),
  };
}

/**
 * Seeds the admin doctor form. `accountEmail` has no column in the mock store:
 * a real backend would return the doctor's login email from the accounts table,
 * so we reuse the demo account fixture when one exists and otherwise derive a
 * deterministic placeholder. It is display-only — no login is provisioned.
 */
export function doctorToAdminFormValues(doctor: Doctor): AdminDoctorFormValues {
  return {
    name: doctor.name,
    credentials: doctor.credentials,
    specialtyId: doctor.specialtyId,
    experienceYears: doctor.experienceYears,
    accountEmail:
      MOCK_ACCOUNTS.find((account) => account.doctorId === doctor.id)?.email ??
      `${doctor.id}@demo.medibook.local`,
    ...doctorToProfileFormValues(doctor),
  };
}
