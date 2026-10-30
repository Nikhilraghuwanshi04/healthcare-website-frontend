import { beforeEach, describe, expect, it } from 'vitest';

import { ServiceError } from '@/lib/errors';
import { filterDoctorSummaries, getDoctor, listCities, listDoctors } from '@/services/doctor-service';
import { listDoctorSlots } from '@/services/slot-service';
import { resetMockStore } from '@/services/mock-store';

beforeEach(() => {
  resetMockStore();
});

describe('doctor discovery', () => {
  it('lists the seeded catalogue with a next available slot', async () => {
    const doctors = await listDoctors();
    expect(doctors.length).toBeGreaterThan(10);
    expect(doctors.every((doctor) => doctor.nextAvailableSlotAt !== null)).toBe(true);
  });

  it('matches search text against name, specialty and city', async () => {
    const doctors = await listDoctors({ search: 'cardiology' });
    expect(doctors.length).toBeGreaterThan(0);
    expect(doctors.every((doctor) => doctor.specialtyName === 'Cardiology')).toBe(true);

    const byCity = await listDoctors({ search: 'pune' });
    expect(byCity.every((doctor) => doctor.city === 'Pune')).toBe(true);
  });

  it('filters and sorts without mutating the source list', async () => {
    const all = await listDoctors();
    const feeAsc = filterDoctorSummaries(all, { sort: 'fee_asc' });
    expect(feeAsc[0].consultationFeeInr).toBeLessThanOrEqual(feeAsc[feeAsc.length - 1].consultationFeeInr);

    const affordable = filterDoctorSummaries(all, { maxFeeInr: 700, acceptingNewPatientsOnly: true });
    expect(affordable.every((doctor) => doctor.consultationFeeInr <= 700 && doctor.acceptingNewPatients)).toBe(true);

    const videoOnly = filterDoctorSummaries(all, { modes: ['video'] });
    expect(videoOnly.every((doctor) => doctor.modes.includes('video'))).toBe(true);
    expect(all.length).toBeGreaterThan(videoOnly.length);
  });

  it('offers a soonest-available ordering', async () => {
    const soonest = await listDoctors({ sort: 'soonest' });
    const times = soonest
      .filter((doctor) => doctor.nextAvailableSlotAt)
      .map((doctor) => new Date(doctor.nextAvailableSlotAt as string).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('exposes cities for the filter panel', async () => {
    const cities = await listCities();
    expect(cities).toContain('Bengaluru');
  });

  it('rejects unknown doctors with a typed error', async () => {
    await expect(getDoctor('dr-does-not-exist')).rejects.toMatchObject({ code: 'not_found' });
    await expect(listDoctorSlots('dr-does-not-exist')).rejects.toBeInstanceOf(ServiceError);
  });

  it('only generates slots on days the clinic is open', async () => {
    const doctor = await getDoctor('dr-aditya-sen'); // weekend-only clinic
    const slots = await listDoctorSlots(doctor.id, { days: 14 });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => [0, 6].includes(new Date(slot.startAt).getDay()))).toBe(true);
  });
});
