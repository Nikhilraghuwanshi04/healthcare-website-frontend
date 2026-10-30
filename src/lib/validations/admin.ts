import { z } from 'zod';

import { emailField, fullNameField } from './fields';
import { checkWorkingHours, doctorProfileFields } from './profile';

/** Administrators create and maintain doctor records; doctors edit only their own profile fields. */
export const adminDoctorFormSchema = z
  .object({
    name: fullNameField,
    credentials: z.string().trim().min(3, 'Enter the qualifications').max(80, 'Keep this under 80 characters'),
    specialtyId: z.string().min(1, 'Select a specialty'),
    experienceYears: z
      .number({ error: 'Enter years of experience' })
      .int('Use whole years')
      .min(0, 'Experience cannot be negative')
      .max(60, 'Experience cannot exceed 60 years'),
    accountEmail: emailField,
    ...doctorProfileFields,
  })
  .superRefine(checkWorkingHours);

export type AdminDoctorFormValues = z.infer<typeof adminDoctorFormSchema>;

export const adminPatientNoteSchema = z.object({
  note: z.string().trim().min(5, 'Write at least 5 characters').max(280, 'Keep this under 280 characters'),
});
