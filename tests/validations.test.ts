import { beforeEach, describe, expect, it } from 'vitest';

import { bookingConsentSchema, bookingDetailsSchema, slotSelectionSchema } from '@/lib/validations/booking';
import { patientProfileSchema, doctorProfileSchema } from '@/lib/validations/profile';
import { signInSchema, signUpSchema } from '@/lib/validations/auth';
import { adminDoctorFormSchema } from '@/lib/validations/admin';
import { signIn, signOut, restoreSession, signUp } from '@/services/auth-service';
import { resetMockStore } from '@/services/mock-store';

const validDetails = {
  fullName: 'Riya Sharma',
  email: 'patient@demo.medibook.local',
  phone: '9812345670',
  dateOfBirth: '1993-04-18',
  gender: 'female' as const,
  reason: 'Recurring lower-back stiffness after long desk hours.',
};

const validDoctorProfile = {
  about: 'Consultant physician focused on diabetes and thyroid care with a long first consultation.',
  highlight: 'Diabetes and thyroid long-case reviews',
  languagesText: 'English, Hindi, Marathi',
  consultationFeeInr: 700,
  modes: ['in_person', 'video'] as ('in_person' | 'video')[],
  acceptingNewPatients: true,
  clinicName: 'Sunrise Family Clinic',
  addressLine: 'Koregaon Bellagio Road',
  city: 'Pune',
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '10:00',
  dayEnd: '17:30',
  slotMinutes: 30 as const,
};

const validPatientProfile = {
  ...validDetails,
  fullName: 'Riya Sharma',
  bloodGroup: 'O+' as const,
  addressLine1: 'Flat 402, Sunbeam Apartments',
  addressLine2: '',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411038',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
};

describe('booking validation', () => {
  it('accepts a complete details step', () => {
    expect(bookingDetailsSchema.safeParse(validDetails).success).toBe(true);
  });

  it('rejects thin reasons, bad phones and future birth dates', () => {
    const result = bookingDetailsSchema.safeParse({
      ...validDetails,
      reason: 'Fever',
      phone: '12345',
      dateOfBirth: '2030-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['reason', 'phone', 'dateOfBirth']));
    }
  });

  it('requires a slot and an explicit consent tick', () => {
    expect(slotSelectionSchema.safeParse({ doctorId: 'dr-x', slotId: '', mode: 'in_person' }).success).toBe(false);
    expect(bookingConsentSchema.safeParse({ confirmAccurate: false }).success).toBe(false);
    expect(bookingConsentSchema.safeParse({ confirmAccurate: true }).success).toBe(true);
  });
});

describe('profile validation', () => {
  it('accepts a well-formed patient profile', () => {
    expect(patientProfileSchema.safeParse(validPatientProfile).success).toBe(true);
  });

  it('requires every emergency contact field once one is filled', () => {
    const result = patientProfileSchema.safeParse({
      ...validPatientProfile,
      emergencyName: 'Anil Sharma',
      emergencyPhone: '',
      emergencyRelation: 'Father',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['emergencyName']);
    }
  });

  it('checks clinic hours, language count and fee bounds', () => {
    expect(doctorProfileSchema.safeParse(validDoctorProfile).success).toBe(true);
    expect(
      doctorProfileSchema.safeParse({ ...validDoctorProfile, dayStart: '18:00', dayEnd: '09:00' }).success,
    ).toBe(false);
    expect(
      doctorProfileSchema.safeParse({ ...validDoctorProfile, languagesText: 'a, b, c, d, e, f, g' }).success,
    ).toBe(false);
    expect(doctorProfileSchema.safeParse({ ...validDoctorProfile, consultationFeeInr: 50 }).success).toBe(false);
  });

  it('extends the doctor profile with identity fields for admins', () => {
    const result = adminDoctorFormSchema.safeParse({
      ...validDoctorProfile,
      name: 'Dr. Neha Verma',
      credentials: 'MBBS, MD',
      specialtyId: 'dermatology',
      experienceYears: 6,
      accountEmail: 'neha.verma@demo.medibook.local',
    });
    expect(result.success).toBe(true);
    expect(
      adminDoctorFormSchema.safeParse({ ...validDoctorProfile, name: 'D', experienceYears: -2 }).success,
    ).toBe(false);
  });
});

describe('mock authentication', () => {
  beforeEach(() => {
    resetMockStore();
    signOut();
  });

  it('validates form shape before any sign-in attempt', () => {
    expect(signInSchema.safeParse({ email: 'not-an-email', password: '123' }).success).toBe(false);
    expect(
      signUpSchema.safeParse({
        fullName: 'Test Patient',
        email: 'test@example.local',
        phone: '9812345678',
        dateOfBirth: '1995-05-05',
        gender: 'other',
        password: 'demopass1',
        confirmPassword: 'demopass2',
      }).success,
    ).toBe(false);
  });

  it('signs a demo account in and restores its session', async () => {
    const session = await signIn({ email: 'patient@demo.medibook.local', password: 'demo1234' });
    expect(session.role).toBe('patient');
    expect(restoreSession()).toMatchObject({ email: session.email });
    signOut();
    expect(restoreSession()).toBeNull();
  });

  it('rejects wrong credentials with a typed unauthorized error', async () => {
    await expect(signIn({ email: 'patient@demo.medibook.local', password: 'wrongpass' })).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('signs a new patient up, then lets that patient sign in', async () => {
    const session = await signUp({
      fullName: 'Kavya Nambiar',
      email: 'kavya.nambiar@example.local',
      phone: '9811122233',
      dateOfBirth: '1997-02-11',
      gender: 'female',
      password: 'kavya1234',
      confirmPassword: 'kavya1234',
    });
    expect(session.role).toBe('patient');
    signOut();
    await expect(
      signIn({ email: 'kavya.nambiar@example.local', password: 'kavya1234' }),
    ).resolves.toMatchObject({ displayName: 'Kavya Nambiar' });
  });
});
