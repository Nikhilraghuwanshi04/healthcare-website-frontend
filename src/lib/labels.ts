import type { z } from 'zod';

import type { genderField } from './validations/fields';

export type Gender = z.infer<typeof genderField>;

/** Human labels for the gender enum, shared by sign-up, booking and profile forms. */
export const GENDER_LABEL: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export const GENDER_OPTIONS: Gender[] = ['male', 'female', 'other', 'prefer_not_to_say'];
