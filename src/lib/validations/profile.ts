import { z } from 'zod';

import {
  bloodGroupField,
  consultationModeField,
  dateOfBirthField,
  emailField,
  fullNameField,
  genderField,
  phoneField,
  postalCodeField,
} from './fields';

export const patientProfileSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phone: phoneField,
    dateOfBirth: dateOfBirthField,
    gender: genderField,
    bloodGroup: bloodGroupField,
    addressLine1: z.string().trim().min(6, 'Enter the street address'),
    addressLine2: z.string().trim().max(80, 'Keep this under 80 characters'),
    city: z.string().trim().min(2, 'Enter the city'),
    state: z.string().trim().min(2, 'Enter the state'),
    postalCode: postalCodeField,
    emergencyName: z.string().trim().max(80),
    emergencyPhone: z.string().trim(),
    emergencyRelation: z.string().trim().max(40),
  })
  .superRefine((values, ctx) => {
    const provided = [values.emergencyName, values.emergencyPhone, values.emergencyRelation].filter(
      (value) => value.length > 0,
    ).length;
    if (provided === 0) return;
    if (provided < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyName'],
        message: 'Fill all emergency contact fields, or leave them empty',
      });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(values.emergencyPhone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyPhone'],
        message: 'Enter a valid 10-digit mobile number',
      });
    }
  });

export type PatientProfileValues = z.infer<typeof patientProfileSchema>;

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time, e.g. 09:30');

export function splitLanguages(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export const doctorProfileFields = {
  about: z.string().trim().min(60, 'Write at least 60 characters').max(600, 'Keep this under 600 characters'),
  highlight: z.string().trim().min(10, 'Write a short headline').max(120, 'Keep this under 120 characters'),
  languagesText: z
    .string()
    .trim()
    .min(2, 'List at least one language')
    .max(120, 'Keep the language list under 120 characters')
    .refine((value) => splitLanguages(value).length <= 6, 'List 1 to 6 languages separated by commas'),
  consultationFeeInr: z
    .number({ error: 'Enter the consultation fee' })
    .int('Use a whole rupee amount')
    .min(100, 'Fee must be at least ₹100')
    .max(5000, 'Fee cannot exceed ₹5000'),
  modes: z.array(consultationModeField).min(1, 'Keep at least one consultation mode'),
  acceptingNewPatients: z.boolean(),
  clinicName: z.string().trim().min(3, 'Enter the clinic name'),
  addressLine: z.string().trim().min(6, 'Enter the clinic address'),
  city: z.string().trim().min(2, 'Enter the city'),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one working day'),
  dayStart: timeField,
  dayEnd: timeField,
  slotMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
};

export function checkWorkingHours(
  values: { dayStart: string; dayEnd: string },
  ctx: z.RefinementCtx,
): void {
  if (values.dayEnd <= values.dayStart) {
    ctx.addIssue({
      code: 'custom',
      path: ['dayEnd'],
      message: 'Closing time must be after the opening time',
    });
  }
}

export const doctorProfileSchema = z
  .object(doctorProfileFields)
  .superRefine(checkWorkingHours);

export type DoctorProfileValues = z.infer<typeof doctorProfileSchema>;
