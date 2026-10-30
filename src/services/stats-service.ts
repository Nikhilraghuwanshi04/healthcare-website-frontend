import { isSameDay, startOfDay } from '@/lib/dates';
import type { Appointment } from '@/types/appointment';
import type { Doctor } from '@/types/doctor';
import type { PatientProfile } from '@/types/user';
import type { AdminDashboardStats, DoctorDashboardStats, PatientDashboardStats, SpecialtyLoad } from '@/types/stats';
import { getDatabase, mockRequest } from './mock-store';

const HELD = new Set(['pending', 'confirmed']);

function upcoming(appointments: Appointment[], now: Date): Appointment[] {
  return appointments.filter(
    (appointment) => HELD.has(appointment.status) && new Date(appointment.startAt) >= now,
  );
}

function byStartAsc(a: Appointment, b: Appointment): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

/** GET /api/patients/:patientId/stats */
export function computePatientStats(appointments: Appointment[], now = new Date()): PatientDashboardStats {
  const scheduled = upcoming(appointments, now).sort(byStartAsc);
  return {
    upcomingCount: scheduled.length,
    pendingCount: appointments.filter((appointment) => appointment.status === 'pending').length,
    completedCount: appointments.filter((appointment) => appointment.status === 'completed').length,
    cancelledCount: appointments.filter((appointment) => appointment.status === 'cancelled').length,
    doctorsConsulted: new Set(
      appointments.filter((appointment) => appointment.status === 'completed').map((appointment) => appointment.doctorId),
    ).size,
    nextAppointment: scheduled[0] ?? null,
  };
}

/** GET /api/doctors/:doctorId/stats */
export function computeDoctorStats(appointments: Appointment[], now = new Date()): DoctorDashboardStats {
  const month = now.getMonth();
  const year = now.getFullYear();
  return {
    todayScheduled: appointments.filter(
      (appointment) => HELD.has(appointment.status) && isSameDay(new Date(appointment.startAt), now),
    ).length,
    pendingRequests: appointments.filter((appointment) => appointment.status === 'pending').length,
    upcomingConfirmed: upcoming(appointments, now).filter((appointment) => appointment.status === 'confirmed').length,
    completedThisMonth: appointments.filter((appointment) => {
      if (appointment.status !== 'completed') return false;
      const date = new Date(appointment.startAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length,
    uniquePatients: new Set(appointments.map((appointment) => appointment.patientId)).size,
    nextAppointment: upcoming(appointments, now).sort(byStartAsc)[0] ?? null,
  };
}

/** GET /api/admin/stats */
export function computeAdminStats(input: {
  doctors: Doctor[];
  patients: PatientProfile[];
  appointments: Appointment[];
  now?: Date;
}): AdminDashboardStats {
  const now = input.now ?? new Date();
  const weekEnd = startOfDay(new Date(now.getTime() + 7 * 86_400_000)).getTime();

  const loadBySpecialty = new Map<string, number>();
  for (const appointment of input.appointments) {
    loadBySpecialty.set(appointment.doctorSpecialtyName, (loadBySpecialty.get(appointment.doctorSpecialtyName) ?? 0) + 1);
  }

  return {
    totalDoctors: input.doctors.length,
    activeDoctors: input.doctors.filter((doctor) => doctor.acceptingNewPatients).length,
    totalPatients: input.patients.length,
    totalAppointments: input.appointments.length,
    appointmentsThisWeek: input.appointments.filter((appointment) => {
      const start = new Date(appointment.startAt).getTime();
      return HELD.has(appointment.status) && start >= now.getTime() && start < weekEnd;
    }).length,
    pendingRequests: input.appointments.filter((appointment) => appointment.status === 'pending').length,
    cancelledCount: input.appointments.filter((appointment) => appointment.status === 'cancelled').length,
    specialtyLoad: Array.from(loadBySpecialty.entries())
      .map<SpecialtyLoad>((([specialtyName, appointmentCount]) => ({ specialtyName, appointmentCount })))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5),
    recentAppointments: [...input.appointments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  };
}

export async function getPatientStats(patientId: string): Promise<PatientDashboardStats> {
  const now = new Date();
  return mockRequest(() =>
    computePatientStats(
      getDatabase().appointments.filter((appointment) => appointment.patientId === patientId),
      now,
    ),
  );
}

export async function getDoctorStats(doctorId: string): Promise<DoctorDashboardStats> {
  const now = new Date();
  return mockRequest(() =>
    computeDoctorStats(
      getDatabase().appointments.filter((appointment) => appointment.doctorId === doctorId),
      now,
    ),
  );
}

export async function getAdminStats(): Promise<AdminDashboardStats> {
  return mockRequest(() => {
    const database = getDatabase();
    return computeAdminStats({
      doctors: database.doctors,
      patients: database.patients,
      appointments: database.appointments,
    });
  });
}
