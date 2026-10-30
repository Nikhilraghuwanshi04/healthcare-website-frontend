import { createId, createReference } from '@/lib/ids';
import { ServiceError } from '@/lib/errors';
import { specialtyNameOf } from '@/data/specialties';
import type {
  Appointment,
  AppointmentListFilter,
  CancelAppointmentInput,
  CreateAppointmentInput,
} from '@/types/appointment';
import { getDatabase, mockRequest, saveAppointments } from './mock-store';
import { collectSlots } from './slot-service';

const HOLDING_STATUSES = new Set(['pending', 'confirmed']);
const CANCELLABLE = new Set(['pending', 'confirmed']);
const PAST = new Set(['completed', 'cancelled']);

const TRANSITIONS: Record<string, Appointment['status'][]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function applyAppointmentFilters(
  appointments: Appointment[],
  filter: AppointmentListFilter,
): Appointment[] {
  const search = filter.search?.trim().toLowerCase() ?? '';
  const from = filter.from ? new Date(filter.from).getTime() : null;
  const to = filter.to ? new Date(filter.to).getTime() : null;

  const matched = appointments.filter((appointment) => {
    if (filter.statuses?.length && !filter.statuses.includes(appointment.status)) return false;
    if (filter.doctorId && appointment.doctorId !== filter.doctorId) return false;
    if (filter.patientId && appointment.patientId !== filter.patientId) return false;
    const start = new Date(appointment.startAt).getTime();
    if (from != null && start < from) return false;
    if (to != null && start > to) return false;
    if (search) {
      const haystack =
        `${appointment.patientName} ${appointment.doctorName} ${appointment.reference} ${appointment.reason}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  switch (filter.sort) {
    case 'latest':
      return matched.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    case 'patient_name':
      return matched.sort((a, b) => a.patientName.localeCompare(b.patientName));
    case 'soonest':
    default:
      return matched.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
}

/** GET /api/appointments */
export async function listAppointments(filter: AppointmentListFilter = {}): Promise<Appointment[]> {
  return mockRequest(() => applyAppointmentFilters(getDatabase().appointments, filter));
}

/** GET /api/appointments/:id */
export async function getAppointment(appointmentId: string): Promise<Appointment> {
  return mockRequest(() => {
    const appointment = getDatabase().appointments.find((candidate) => candidate.id === appointmentId);
    if (!appointment) throw new ServiceError('not_found', 'We could not find that appointment.');
    return appointment;
  });
}

function requireDoctor(doctorId: string) {
  const doctor = getDatabase().doctors.find((candidate) => candidate.id === doctorId);
  if (!doctor) throw new ServiceError('not_found', 'This doctor is no longer accepting bookings.');
  return doctor;
}

/**
 * POST /api/appointments
 * MOCK BOOKING: validates the slot against generated availability, writes an
 * in-store record and marks that slot taken. No payment, message or email is
 * sent anywhere — treat every confirmation as a UI state only.
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const now = new Date();
  return mockRequest(() => {
    const database = getDatabase();
    const doctor = requireDoctor(input.doctorId);

    const slot = collectSlots(doctor, 21, now).find((candidate) => candidate.id === input.slotId);
    if (!slot) throw new ServiceError('not_found', 'That time slot is no longer listed.');
    if (slot.status !== 'available') {
      throw new ServiceError('slot_unavailable', 'That slot was just taken. Pick another time.');
    }
    if (!doctor.modes.includes(input.mode)) {
      throw new ServiceError('invalid_input', 'This doctor does not offer that consultation mode.');
    }

    const appointment: Appointment = {
      id: createId('apt'),
      reference: createReference(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialtyName: specialtyNameOf(doctor.specialtyId),
      patientId: input.patientId,
      patientName: input.patient.fullName,
      patientEmail: input.patient.email,
      patientPhone: input.patient.phone,
      slotId: slot.id,
      startAt: slot.startAt,
      durationMinutes: slot.durationMinutes,
      mode: input.mode,
      reason: input.reason,
      status: 'pending',
      createdAt: now.toISOString(),
      cancelledAt: null,
      cancellationReason: null,
      cancelledBy: null,
      consultationFeeInr: doctor.consultationFeeInr,
    };

    database.appointments.push(appointment);
    saveAppointments();
    return appointment;
  });
}

/** POST /api/appointments/:id/cancel */
export async function cancelAppointment(input: CancelAppointmentInput): Promise<Appointment> {
  return mockRequest(() => {
    const database = getDatabase();
    const appointment = database.appointments.find((candidate) => candidate.id === input.appointmentId);
    if (!appointment) throw new ServiceError('not_found', 'We could not find that appointment.');
    if (!CANCELLABLE.has(appointment.status)) {
      throw new ServiceError('conflict', `This appointment is already ${appointment.status}.`);
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancellationReason = input.reason;
    appointment.cancelledBy = input.actor;
    saveAppointments();
    return { ...appointment };
  });
}

/** PATCH /api/appointments/:id/status — doctor accepts, completes or declines. */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
): Promise<Appointment> {
  return mockRequest(() => {
    const database = getDatabase();
    const appointment = database.appointments.find((candidate) => candidate.id === appointmentId);
    if (!appointment) throw new ServiceError('not_found', 'We could not find that appointment.');

    if (!TRANSITIONS[appointment.status]?.includes(status)) {
      throw new ServiceError('conflict', `Cannot move a ${appointment.status} appointment to ${status}.`);
    }

    if (status === 'cancelled') {
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date().toISOString();
      appointment.cancellationReason = 'Cancelled by the clinic';
      appointment.cancelledBy = 'doctor';
    } else {
      appointment.status = status;
    }
    saveAppointments();
    return { ...appointment };
  });
}

export function isSlotHeldBy(status: Appointment['status']): boolean {
  return HOLDING_STATUSES.has(status);
}

export function isHistorical(appointment: Appointment): boolean {
  return PAST.has(appointment.status);
}
