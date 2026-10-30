import { describe, expect, it } from 'vitest';

import { tabDefinitionOf } from '@/features/patients/patient-appointments';
import { applyAppointmentFilters } from '@/services/appointment-service';
import type { Appointment } from '@/types/appointment';

function appointment(id: string, status: Appointment['status'], startAt: string): Appointment {
  return {
    id,
    reference: `MB-${id}`,
    doctorId: 'dr-ananya-iyer',
    doctorName: 'Dr. Ananya Iyer',
    doctorSpecialtyName: 'Cardiology',
    patientId: 'pta-riya-sharma',
    patientName: 'Riya Sharma',
    patientEmail: 'riya@example.com',
    patientPhone: '9812345670',
    slotId: `slot-${id}`,
    startAt,
    durationMinutes: 30,
    mode: 'in_person',
    reason: 'Routine follow up for blood pressure review',
    status,
    createdAt: '2026-10-01T09:00:00.000Z',
    cancelledAt: null,
    cancellationReason: null,
    cancelledBy: null,
    consultationFeeInr: 1200,
  };
}

const NOW = '2026-10-24T10:00:00.000Z';
const FUTURE = '2026-11-02T10:00:00.000Z';

const records = [
  appointment('a-pending-future', 'pending', FUTURE),
  appointment('b-pending-past', 'pending', '2026-10-20T10:00:00.000Z'),
  appointment('c-confirmed-future', 'confirmed', FUTURE),
  appointment('d-completed', 'completed', '2026-09-10T10:00:00.000Z'),
  appointment('e-cancelled', 'cancelled', FUTURE),
];

describe('patient appointment tabs', () => {
  it('shows only future holdings under Upcoming', () => {
    const tab = tabDefinitionOf('upcoming');

    expect(tab.statuses).toEqual(['pending', 'confirmed']);
    expect(tab.upcomingOnly).toBe(true);

    const visible = applyAppointmentFilters(records, {
      statuses: tab.statuses,
      from: NOW,
      sort: 'soonest',
    });

    expect(visible.map((item) => item.id)).toEqual(['a-pending-future', 'c-confirmed-future']);
  });

  it('keeps a stale pending record out of Upcoming but inside Pending', () => {
    const stale = applyAppointmentFilters(records, { statuses: tabDefinitionOf('pending').statuses, from: NOW });
    const all = applyAppointmentFilters(records, { statuses: tabDefinitionOf('pending').statuses });

    expect(stale.map((item) => item.id)).toEqual(['a-pending-future']);
    expect(all.map((item) => item.id)).toContain('b-pending-past');
  });

  it('falls back to the first tab for an unknown value', () => {
    expect(tabDefinitionOf('not-a-tab' as 'all')).toBe(tabDefinitionOf('upcoming'));
  });

  it('lists every record under All', () => {
    const tab = tabDefinitionOf('all');

    expect(tab.statuses).toBeUndefined();
    expect(applyAppointmentFilters(records, { statuses: tab.statuses })).toHaveLength(records.length);
  });
});
