import type { Appointment, AppointmentStatus } from '@/types/appointment';
import type { Doctor } from '@/types/doctor';
import { addDays, startOfDay } from '@/lib/dates';
import { daySlotStarts, slotIdOf } from '@/lib/slot-rules';
import { findDoctorById } from './doctors';
import { DEMO_PATIENT_ID, findPatientById } from './patients';
import { specialtyNameOf } from './specialties';

interface SeedDefinition {
  doctorId: string;
  patientId: string;
  /** Signed count of *open* clinic days away from today. Negative is in the past. */
  dayShift: number;
  slotIndex: number;
  status: AppointmentStatus;
  reason: string;
  video?: boolean;
}

/** Walks the doctor's weekly pattern so seeds stay valid on any run date. */
function shiftedOpenDay(doctor: Doctor, dayShift: number): Date {
  const isOpen = (day: Date) =>
    Boolean(doctor.availability[day.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6]);
  const today = startOfDay(new Date());
  const direction = dayShift < 0 ? -1 : 1;
  let remaining = Math.max(Math.abs(dayShift), 1);
  let cursor = addDays(today, direction);

  if (dayShift === 0 && isOpen(today)) return today;

  for (let walked = 0; walked < 60; walked += 1) {
    if (isOpen(cursor)) {
      remaining -= 1;
      if (remaining === 0) return cursor;
    }
    cursor = addDays(cursor, direction);
  }
  throw new Error(`Mock seed: doctor ${doctor.id} has no open clinic day ${dayShift} days away`);
}

function referenceFor(index: number): string {
  return `MB-${(index * 7919 + 104729).toString(36).toUpperCase().padStart(5, '0').slice(-6)}`;
}

function toAppointment(seed: SeedDefinition, index: number): Appointment {
  const doctor = findDoctorById(seed.doctorId);
  if (!doctor) throw new Error(`Mock seed: unknown doctor ${seed.doctorId}`);
  const patient = findPatientById(seed.patientId);
  if (!patient) throw new Error(`Mock seed: unknown patient ${seed.patientId}`);

  const day = shiftedOpenDay(doctor, seed.dayShift);
  const window = doctor.availability[day.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  if (!window) throw new Error(`Mock seed: ${doctor.id} closed on ${day.toISOString()}`);

  const start = daySlotStarts(window, day)[seed.slotIndex];
  if (!start) throw new Error(`Mock seed: slot ${seed.slotIndex} outside ${doctor.id} clinic hours`);

  const cancelled = seed.status === 'cancelled';
  return {
    id: `apt-${seed.doctorId.replace('dr-', '')}-${index}`,
    reference: referenceFor(index),
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialtyName: specialtyNameOf(doctor.specialtyId),
    patientId: patient.id,
    patientName: patient.fullName,
    patientEmail: patient.email,
    patientPhone: patient.phone,
    slotId: slotIdOf(doctor.id, start),
    startAt: start.toISOString(),
    durationMinutes: window.slotMinutes,
    mode: seed.video && doctor.modes.includes('video') ? 'video' : doctor.modes[0],
    reason: seed.reason,
    status: seed.status,
    createdAt: new Date(start.getTime() - 9 * 86_400_000).toISOString(),
    cancelledAt: cancelled ? new Date(start.getTime() - 86_400_000).toISOString() : null,
    cancellationReason: cancelled ? 'Rescheduled after a work trip' : null,
    cancelledBy: cancelled ? (patient.id === DEMO_PATIENT_ID ? 'patient' : 'doctor') : null,
    consultationFeeInr: doctor.consultationFeeInr,
  };
}

const SEEDS: SeedDefinition[] = [
  // Demo patient history and upcoming care — keeps /patient screens meaningful.
  {
    doctorId: 'dr-rahul-deshmukh',
    patientId: DEMO_PATIENT_ID,
    dayShift: 1,
    slotIndex: 2,
    status: 'confirmed',
    reason: 'Follow-up on vitamin D reports and persistent lower-back stiffness.',
  },
  {
    doctorId: 'dr-meera-pillai',
    patientId: DEMO_PATIENT_ID,
    dayShift: 2,
    slotIndex: 1,
    status: 'pending',
    reason: 'Recurring acne flare-up on cheeks and jawline despite the current routine.',
  },
  {
    doctorId: 'dr-aditya-sen',
    patientId: DEMO_PATIENT_ID,
    dayShift: 4,
    slotIndex: 1,
    status: 'confirmed',
    reason: 'Annual cardiac screening since a family history of hypertension.',
    video: false,
  },
  {
    doctorId: 'dr-priya-joshi',
    patientId: DEMO_PATIENT_ID,
    dayShift: -1,
    slotIndex: 3,
    status: 'completed',
    reason: 'Scaling and polishing plus sensitivity check on the lower molars.',
  },
  {
    doctorId: 'dr-sneha-kulkarni',
    patientId: DEMO_PATIENT_ID,
    dayShift: -3,
    slotIndex: 0,
    status: 'cancelled',
    reason: 'Child vaccination schedule reminder visit.',
  },
  {
    doctorId: 'dr-ananya-iyer',
    patientId: DEMO_PATIENT_ID,
    dayShift: -6,
    slotIndex: 5,
    status: 'completed',
    reason: 'Chest discomfort after exertion; ECG review requested.',
  },
  {
    doctorId: 'dr-fatima-sheikh',
    patientId: DEMO_PATIENT_ID,
    dayShift: 3,
    slotIndex: 2,
    status: 'pending',
    reason: 'Sleep pattern review and anxiety counselling follow-up over video.',
    video: true,
  },
  // Other patients — powers the doctor and admin queues.
  { doctorId: 'dr-ananya-iyer', patientId: 'pta-lakshmi-rao', dayShift: 0, slotIndex: 0, status: 'confirmed', reason: 'Blood pressure titration and lipid panel discussion.' },
  { doctorId: 'dr-ananya-iyer', patientId: 'pta-imran-khan', dayShift: 0, slotIndex: 4, status: 'confirmed', reason: 'Post-MI three-month review with stress test reports.' },
  { doctorId: 'dr-ananya-iyer', patientId: 'pta-neha-gupta', dayShift: 1, slotIndex: 6, status: 'pending', reason: 'Palpitations during exercise; echo interpretation needed.' },
  { doctorId: 'dr-ananya-iyer', patientId: 'pta-arun-kumar', dayShift: 2, slotIndex: 3, status: 'confirmed', reason: 'Second opinion on a reported mild valve regurgitation.' },
  { doctorId: 'dr-ananya-iyer', patientId: 'pta-vikram-singh', dayShift: -2, slotIndex: 8, status: 'completed', reason: 'Hypertension refill and lifestyle plan update.' },
  { doctorId: 'dr-rahul-deshmukh', patientId: 'pta-joseph-martin', dayShift: 0, slotIndex: 1, status: 'confirmed', reason: 'Recurrent fever and body ache for four days.' },
  { doctorId: 'dr-rahul-deshmukh', patientId: 'pta-farah-alam', dayShift: 0, slotIndex: 7, status: 'pending', reason: 'Thyroid medication dose adjustment with latest TSH values.' },
  { doctorId: 'dr-rahul-deshmukh', patientId: 'pta-deepa-nair', dayShift: 2, slotIndex: 5, status: 'confirmed', reason: 'Seasonal allergy and sinus pressure review.' },
  { doctorId: 'dr-rahul-deshmukh', patientId: 'pta-sameer-joshi', dayShift: -4, slotIndex: 2, status: 'completed', reason: 'Annual health check interpretation.' },
  { doctorId: 'dr-sneha-kulkarni', patientId: 'pta-farah-alam', dayShift: 1, slotIndex: 4, status: 'confirmed', reason: 'Two-year-old fever with rash and poor appetite.' },
  { doctorId: 'dr-sneha-kulkarni', patientId: 'pta-neha-gupta', dayShift: 3, slotIndex: 6, status: 'pending', reason: 'Growth chart and dietary review for a picky eater.' },
  { doctorId: 'dr-arjun-reddy', patientId: 'pta-imran-khan', dayShift: 1, slotIndex: 2, status: 'confirmed', reason: 'Migraine frequency review after starting preventer therapy.' },
  { doctorId: 'dr-arjun-reddy', patientId: 'pta-vikram-singh', dayShift: 2, slotIndex: 6, status: 'confirmed', reason: 'Numbness in both feet; nerve conduction report discussion.' },
  { doctorId: 'dr-vikram-nair', patientId: 'pta-deepa-nair', dayShift: 1, slotIndex: 0, status: 'confirmed', reason: 'Second-trimester antenatal scan review.' },
  { doctorId: 'dr-meera-pillai', patientId: 'pta-arun-kumar', dayShift: 2, slotIndex: 4, status: 'pending', reason: 'Patchy hair loss over the last two months.' },
  { doctorId: 'dr-imran-qureshi', patientId: 'pta-lakshmi-rao', dayShift: 1, slotIndex: 3, status: 'confirmed', reason: 'Cataract surgery readiness assessment.' },
  { doctorId: 'dr-karan-malhotra', patientId: 'pta-sameer-joshi', dayShift: 1, slotIndex: 1, status: 'confirmed', reason: 'ACL rehabilitation progress after six weeks.' },
  { doctorId: 'dr-fatima-sheikh', patientId: 'pta-joseph-martin', dayShift: 2, slotIndex: 4, status: 'confirmed', reason: 'Low mood and insomnia medication review over video.', video: true },
  { doctorId: 'dr-lakshmi-venkat', patientId: 'pta-vikram-singh', dayShift: 3, slotIndex: 2, status: 'pending', reason: 'HbA1c trend review and metformin tolerance concerns.' },
];

/** Deterministic given the run date: future slots look bookable, past ones look historical. */
export function createSeedAppointments(): Appointment[] {
  return SEEDS.map(toAppointment);
}
