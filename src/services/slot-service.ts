import { addDays, startOfDay } from '@/lib/dates';
import { ServiceError } from '@/lib/errors';
import { daySlotStarts, slotIdOf } from '@/lib/slot-rules';
import type { Weekday } from '@/types/common';
import type { AppointmentSlot, Doctor, SlotStatus } from '@/types/doctor';
import { getDatabase, mockRejection, mockRequest } from './mock-store';

export const SLOT_HORIZON_DAYS = 21;
/** Mock rule: same-day slots need two hours of notice, like a real front desk. */
export const LEAD_TIME_MINUTES = 120;

const HOLDING_STATUSES = new Set(['pending', 'confirmed']);

function bookedSlotIds(doctorId: string): Set<string> {
  return new Set(
    getDatabase()
      .appointments.filter((appointment) => appointment.doctorId === doctorId && HOLDING_STATUSES.has(appointment.status))
      .map((appointment) => appointment.slotId),
  );
}

function slotStatus(start: Date, booked: Set<string>, id: string, now: Date): SlotStatus {
  const earliestBookable = new Date(now.getTime() + LEAD_TIME_MINUTES * 60_000);
  if (start < earliestBookable) return 'closed';
  if (booked.has(id)) return 'booked';
  return 'available';
}

export function slotsForDay(doctor: Doctor, day: Date, now = new Date()): AppointmentSlot[] {
  const window = doctor.availability[day.getDay() as Weekday];
  if (!window) return [];

  const booked = bookedSlotIds(doctor.id);
  return daySlotStarts(window, day).map((start) => {
    const id = slotIdOf(doctor.id, start);
    return {
      id,
      doctorId: doctor.id,
      startAt: start.toISOString(),
      durationMinutes: window.slotMinutes,
      status: slotStatus(start, booked, id, now),
    };
  });
}

export function collectSlots(doctor: Doctor, days: number, now: Date): AppointmentSlot[] {
  const firstDay = startOfDay(now);
  const slots: AppointmentSlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    slots.push(...slotsForDay(doctor, addDays(firstDay, offset), now));
  }
  return slots;
}

export function nextAvailableSlotFor(doctor: Doctor, now = new Date()): AppointmentSlot | null {
  return collectSlots(doctor, SLOT_HORIZON_DAYS, now).find((slot) => slot.status === 'available') ?? null;
}

/** GET /api/doctors/:doctorId/slots */
export async function listDoctorSlots(
  doctorId: string,
  options: { days?: number } = {},
): Promise<AppointmentSlot[]> {
  const doctor = getDatabase().doctors.find((candidate) => candidate.id === doctorId);
  if (!doctor) {
    return mockRejection(new ServiceError('not_found', 'This doctor profile is no longer available.'));
  }
  const now = new Date();
  return mockRequest(() => collectSlots(doctor, options.days ?? SLOT_HORIZON_DAYS, now));
}

/** GET /api/slots/:slotId?doctorId= — used to re-validate before writing a booking. */
export async function findSlot(doctorId: string, slotId: string): Promise<AppointmentSlot | null> {
  const doctor = getDatabase().doctors.find((candidate) => candidate.id === doctorId);
  if (!doctor) {
    return mockRejection(new ServiceError('not_found', 'This doctor profile is no longer available.'));
  }
  const now = new Date();
  return mockRequest(() => collectSlots(doctor, SLOT_HORIZON_DAYS, now).find((slot) => slot.id === slotId) ?? null);
}
