import { beforeEach, describe, expect, it } from 'vitest';

import { DEMO_PATIENT_ID } from '@/data/patients';
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
} from '@/services/appointment-service';
import { listDoctorSlots } from '@/services/slot-service';
import { computeAdminStats, computeDoctorStats, computePatientStats } from '@/services/stats-service';
import { getDoctor } from '@/services/doctor-service';
import { getDatabase, resetMockStore } from '@/services/mock-store';
import type { PatientContactDetails } from '@/types/appointment';

const PATIENT: PatientContactDetails = {
  fullName: 'Riya Sharma',
  email: 'patient@demo.medibook.local',
  phone: '9812345670',
  dateOfBirth: '1993-04-18',
  gender: 'female',
};

async function firstAvailableSlotId(doctorId: string): Promise<string> {
  const slots = await listDoctorSlots(doctorId);
  const slot = slots.find((candidate) => candidate.status === 'available');
  if (!slot) throw new Error(`No available slot for ${doctorId} in the mock window`);
  return slot.id;
}

beforeEach(() => {
  resetMockStore();
});

describe('booking flow', () => {
  it('creates a pending appointment from an available slot', async () => {
    const slotId = await firstAvailableSlotId('dr-ananya-iyer');
    const appointment = await createAppointment({
      doctorId: 'dr-ananya-iyer',
      slotId,
      patientId: DEMO_PATIENT_ID,
      patient: PATIENT,
      reason: 'Palpitations while climbing stairs for the last two weeks.',
      mode: 'in_person',
    });

    expect(appointment.status).toBe('pending');
    expect(appointment.reference).toMatch(/^MB-/);
    expect(appointment.doctorName).toBe('Dr. Ananya Iyer');
    await expect(getAppointment(appointment.id)).resolves.toMatchObject({ id: appointment.id });
  });

  it('blocks the slot for everyone else once booked', async () => {
    const slotId = await firstAvailableSlotId('dr-rahul-deshmukh');
    await createAppointment({
      doctorId: 'dr-rahul-deshmukh',
      slotId,
      patientId: DEMO_PATIENT_ID,
      patient: PATIENT,
      reason: 'Persistent cough since the flu cleared two weeks ago.',
      mode: 'video',
    });

    const slots = await listDoctorSlots('dr-rahul-deshmukh');
    expect(slots.find((slot) => slot.id === slotId)?.status).toBe('booked');

    await expect(
      createAppointment({
        doctorId: 'dr-rahul-deshmukh',
        slotId,
        patientId: DEMO_PATIENT_ID,
        patient: PATIENT,
        reason: 'Trying to take the slot that was just booked.',
        mode: 'video',
      }),
    ).rejects.toMatchObject({ code: 'slot_unavailable' });
  });

  it('refuses a consultation mode the doctor does not offer', async () => {
    const doctor = await getDoctor('dr-meera-pillai'); // in-person only
    const slotId = await firstAvailableSlotId(doctor.id);
    await expect(
      createAppointment({
        doctorId: doctor.id,
        slotId,
        patientId: DEMO_PATIENT_ID,
        patient: PATIENT,
        reason: 'Requests a video visit that this clinic does not provide.',
        mode: 'video',
      }),
    ).rejects.toMatchObject({ code: 'invalid_input' });
  });

  it('cancels once, then reports a conflict', async () => {
    const slotId = await firstAvailableSlotId('dr-priya-joshi');
    const appointment = await createAppointment({
      doctorId: 'dr-priya-joshi',
      slotId,
      patientId: DEMO_PATIENT_ID,
      patient: PATIENT,
      reason: 'Tooth sensitivity follow-up after the cleaning visit.',
      mode: 'in_person',
    });

    const cancelled = await cancelAppointment({
      appointmentId: appointment.id,
      reason: 'Travel plan changed',
      actor: 'patient',
    });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledBy).toBe('patient');

    await expect(
      cancelAppointment({ appointmentId: appointment.id, reason: 'Again', actor: 'patient' }),
    ).rejects.toMatchObject({ code: 'conflict' });

    // A cancelled appointment frees the slot again.
    const slots = await listDoctorSlots('dr-priya-joshi');
    expect(slots.find((slot) => slot.id === slotId)?.status).toBe('available');
  });

  it('only allows documented status transitions', async () => {
    const slotId = await firstAvailableSlotId('dr-sneha-kulkarni');
    const appointment = await createAppointment({
      doctorId: 'dr-sneha-kulkarni',
      slotId,
      patientId: DEMO_PATIENT_ID,
      patient: PATIENT,
      reason: 'Fever and rash follow-up for a two-year-old.',
      mode: 'in_person',
    });

    await expect(updateAppointmentStatus(appointment.id, 'completed')).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(updateAppointmentStatus(appointment.id, 'confirmed')).resolves.toMatchObject({
      status: 'confirmed',
    });
    await expect(updateAppointmentStatus(appointment.id, 'completed')).resolves.toMatchObject({
      status: 'completed',
    });
  });

  it('filters appointment lists by role scope', async () => {
    const mine = await listAppointments({ patientId: DEMO_PATIENT_ID });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((appointment) => appointment.patientId === DEMO_PATIENT_ID)).toBe(true);

    const pendingOnly = await listAppointments({ statuses: ['pending'] });
    expect(pendingOnly.every((appointment) => appointment.status === 'pending')).toBe(true);

    const searchHit = await listAppointments({ search: 'hypertension' });
    expect(searchHit.length).toBeGreaterThan(0);
  });
});

describe('dashboard statistics', () => {
  it('derives patient stats from mock records', () => {
    const appointments = getDatabase().appointments.filter((appointment) => appointment.patientId === DEMO_PATIENT_ID);
    const stats = computePatientStats(appointments);
    expect(stats.upcomingCount).toBeGreaterThan(0);
    expect(stats.completedCount).toBeGreaterThanOrEqual(1);
    expect(stats.nextAppointment?.patientId).toBe(DEMO_PATIENT_ID);
  });

  it('derives doctor and admin stats without inventing data', () => {
    const doctorAppointments = getDatabase().appointments.filter((appointment) => appointment.doctorId === 'dr-ananya-iyer');
    const doctorStats = computeDoctorStats(doctorAppointments);
    expect(doctorStats.uniquePatients).toBe(new Set(doctorAppointments.map((a) => a.patientId)).size);

    const database = getDatabase();
    const adminStats = computeAdminStats({
      doctors: database.doctors,
      patients: database.patients,
      appointments: database.appointments,
    });
    expect(adminStats.totalDoctors).toBe(database.doctors.length);
    expect(adminStats.totalAppointments).toBe(database.appointments.length);
    expect(adminStats.specialtyLoad.length).toBeGreaterThan(0);
    expect(adminStats.specialtyLoad[0].appointmentCount).toBeGreaterThanOrEqual(
      adminStats.specialtyLoad[adminStats.specialtyLoad.length - 1].appointmentCount,
    );
  });
});
