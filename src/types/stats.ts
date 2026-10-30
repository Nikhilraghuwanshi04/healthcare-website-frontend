import type { Appointment } from './appointment';

export interface PatientDashboardStats {
  upcomingCount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  doctorsConsulted: number;
  nextAppointment: Appointment | null;
}

export interface DoctorDashboardStats {
  todayScheduled: number;
  pendingRequests: number;
  upcomingConfirmed: number;
  completedThisMonth: number;
  uniquePatients: number;
  nextAppointment: Appointment | null;
}

export interface SpecialtyLoad {
  specialtyName: string;
  appointmentCount: number;
}

export interface AdminDashboardStats {
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentsThisWeek: number;
  pendingRequests: number;
  cancelledCount: number;
  specialtyLoad: SpecialtyLoad[];
  recentAppointments: Appointment[];
}
