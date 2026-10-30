import { z } from 'zod';

import {
  consultationModeField,
  dateOfBirthField,
  emailField,
  fullNameField,
  genderField,
  phoneField,
  reasonField,
} from './fields';

export const slotSelectionSchema = z.object({
  doctorId: z.string().min(1, 'Choose a doctor to continue'),
  slotId: z.string().min(1, 'Select an available time slot'),
  mode: consultationModeField,
});

export type SlotSelectionValues = z.infer<typeof slotSelectionSchema>;

/** Step 3 of the booking wizard: who the appointment is for and why. */
export const bookingDetailsSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  dateOfBirth: dateOfBirthField,
  gender: genderField,
  reason: reasonField,
});

export type BookingDetailsValues = z.infer<typeof bookingDetailsSchema>;

export const bookingConsentSchema = z.object({
  confirmAccurate: z.boolean().refine((value) => value, {
    message: 'Confirm the details are accurate before booking',
  }),
});

export type BookingConsentValues = z.infer<typeof bookingConsentSchema>;
