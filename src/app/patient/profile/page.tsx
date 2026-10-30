import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { PatientProfileForm } from '@/features/patients/patient-profile-form';

export const metadata: Metadata = {
  title: 'My profile',
  description: 'Edit the contact, address and emergency details used when booking.',
};

export default function PatientProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="These details prefill the booking flow. Saving writes to the mock store in this browser only."
      />
      <PatientProfileForm />
    </div>
  );
}
