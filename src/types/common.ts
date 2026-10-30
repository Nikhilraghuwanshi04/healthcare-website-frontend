export type UserRole = 'patient' | 'doctor' | 'admin';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'unknown'] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type ConsultationMode = 'in_person' | 'video';

export interface WeeklyDayWindow {
  /** 24h local time, "09:30" */
  start: string;
  /** 24h local time, "17:00" */
  end: string;
  slotMinutes: 30 | 45 | 60;
}

/** Keys are ISO weekdays: 0 = Sunday ... 6 = Saturday. Null means the clinic is closed. */
export type WeeklyAvailability = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, WeeklyDayWindow | null>;

export interface ClinicLocation {
  clinicName: string;
  addressLine: string;
  city: string;
}

export type Weekday = keyof WeeklyAvailability;
