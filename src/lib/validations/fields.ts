import { z } from 'zod';

import { fromIsoDate } from '@/lib/dates';
import { BLOOD_GROUPS } from '@/types/common';

export const fullNameField = z
  .string()
  .trim()
  .min(3, 'Enter the full name')
  .max(80, 'Names longer than 80 characters are not supported');

export const emailField = z.email('Enter a valid email address');

export const phoneField = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const isoDateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date');

export const dateOfBirthField = isoDateField.refine((value) => {
  const dob = fromIsoDate(value);
  const now = new Date();
  if (Number.isNaN(dob.getTime())) return false;
  if (dob > now) return false;
  const age = (now.getTime() - dob.getTime()) / (365.25 * 86_400_000);
  return age >= 0 && age <= 120;
}, 'Enter a date of birth in the past');

export const genderField = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const postalCodeField = z
  .string()
  .trim()
  .regex(/^\d{5,6}$/, 'Enter a 5 or 6 digit postal code');

export const bloodGroupField = z.enum(BLOOD_GROUPS);

export const consultationModeField = z.enum(['in_person', 'video']);

export const reasonField = z
  .string()
  .trim()
  .min(10, 'Describe the reason in at least 10 characters')
  .max(300, 'Keep the reason under 300 characters');

export const cancellationReasonField = z
  .string()
  .trim()
  .min(3, 'Select or write a short reason')
  .max(120, 'Keep the reason under 120 characters');
