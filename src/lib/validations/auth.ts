import { z } from 'zod';

import { dateOfBirthField, emailField, fullNameField, genderField, phoneField } from './fields';

/** MOCK AUTHENTICATION ONLY — these values are checked against local seed data. */
export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(6, 'Enter the password (at least 6 characters)'),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phone: phoneField,
    dateOfBirth: dateOfBirthField,
    gender: genderField,
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Re-enter the password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
