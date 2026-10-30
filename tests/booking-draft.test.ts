import { describe, expect, it } from 'vitest';

import {
  EMPTY_DRAFT,
  bookingDetailsFromProfile,
  clearBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from '@/features/appointments/booking-model';
import { MOCK_STORAGE_KEYS } from '@/lib/storage';
import { PATIENTS } from '@/data/patients';
import { BLOOD_GROUPS } from '@/types/common';

describe('booking draft', () => {
  it('round-trips a half-finished booking through localStorage', () => {
    const draft = {
      step: 'details' as const,
      selection: { doctorId: 'dr-ananya-iyer', slotId: 'dr-ananya-iyer@2026-11-02T10:30', mode: 'video' as const },
      details: {
        fullName: 'Riya Sharma',
        email: 'riya@example.com',
        phone: '9812345670',
        dateOfBirth: '1993-04-18',
        gender: 'female' as const,
        reason: 'Recurring headache for two weeks',
      },
    };

    writeBookingDraft(draft);

    expect(readBookingDraft()).toEqual(draft);
    expect(JSON.parse(window.localStorage.getItem(MOCK_STORAGE_KEYS.bookingDraft) ?? '{}').step).toBe('details');
  });

  it('starts from the doctor step when nothing is stored', () => {
    expect(readBookingDraft()).toBeNull();
    expect(EMPTY_DRAFT.step).toBe('doctor');
    expect(EMPTY_DRAFT.details).toBeNull();
  });

  it('clears the draft so a confirmed booking cannot be replayed', () => {
    writeBookingDraft({ ...EMPTY_DRAFT, step: 'review' });
    clearBookingDraft();

    expect(readBookingDraft()).toBeNull();
    expect(window.localStorage.getItem(MOCK_STORAGE_KEYS.bookingDraft)).toBeNull();
  });

  it('recovers from corrupted storage instead of throwing', () => {
    window.localStorage.setItem(MOCK_STORAGE_KEYS.bookingDraft, '{not json');

    expect(readBookingDraft()).toBeNull();
    expect(window.localStorage.getItem(MOCK_STORAGE_KEYS.bookingDraft)).toBeNull();
  });
});

describe('booking prefill', () => {
  it('copies identity fields but never the visit reason', () => {
    const patient = PATIENTS[0];
    const values = bookingDetailsFromProfile(patient);

    expect(values).toEqual({
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      reason: '',
    });
  });

  it('keeps every seeded patient inside the validation domain', () => {
    for (const patient of PATIENTS) {
      const values = bookingDetailsFromProfile(patient);
      expect(values.fullName.length).toBeGreaterThan(2);
      expect(values.phone).toMatch(/^[6-9]\d{9}$/);
      expect(patient.bloodGroup === null || BLOOD_GROUPS.includes(patient.bloodGroup)).toBe(true);
    }
  });
});
