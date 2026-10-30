import {
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { UserRole } from '@/types/common';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for every role's navigation, used by desktop and mobile. */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  patient: [
    { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patient/appointments', label: 'My appointments', icon: CalendarDays },
    { href: '/patient/book', label: 'Book appointment', icon: CalendarPlus },
    { href: '/patient/profile', label: 'My profile', icon: UserCog },
  ],
  doctor: [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Appointment queue', icon: CalendarDays },
    { href: '/doctor/profile', label: 'Clinic profile', icon: Stethoscope },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/admin/patients', label: 'Patients', icon: Users },
    { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  ],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
};

export const ROLE_HOME: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};
