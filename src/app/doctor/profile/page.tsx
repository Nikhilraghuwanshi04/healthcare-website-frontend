import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { DoctorProfileForm } from '@/features/doctors-dashboard/doctor-profile-form';

export const metadata: Metadata = {
  title: 'Clinic profile',
  description: 'Edit the practice details, consultation modes and working hours shown to patients.',
};

export default function DoctorProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic profile"
        description="Update how your practice appears in the demo directory. Your name and credentials are managed by administrators."
      />
      <DoctorProfileForm />
    </div>
  );
}
