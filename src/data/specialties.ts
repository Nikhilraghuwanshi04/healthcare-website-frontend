import type { Specialty } from '@/types/doctor';

export const SPECIALTIES: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Heart and vascular care, ECG, echocardiography and hypertension management.',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Skin, hair and nail care including acne, allergies and dermatoscopy.',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Newborn, child and adolescent care with vaccination follow-ups.',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    description: 'Bones, joints, sports injuries and post-operative rehabilitation.',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    description: 'Headache, epilepsy, stroke follow-up and nerve conduction studies.',
  },
  {
    id: 'general-medicine',
    name: 'General Medicine',
    description: 'Fever, diabetes, thyroid and everyday primary care consultations.',
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    description: 'Anxiety, depression, sleep care and counselling follow-ups.',
  },
  {
    id: 'gynecology',
    name: 'Gynecology',
    description: 'Reproductive health, pregnancy care and menstrual wellness.',
  },
  {
    id: 'dentistry',
    name: 'Dentistry',
    description: 'Cleaning, root canal, orthodontics and oral check-ups.',
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    description: 'Vision tests, cataract, glaucoma and retinal check-ups.',
  },
];

export const SPECIALTY_BY_ID = new Map(SPECIALTIES.map((specialty) => [specialty.id, specialty]));

export function specialtyNameOf(specialtyId: string): string {
  return SPECIALTY_BY_ID.get(specialtyId)?.name ?? specialtyId;
}
