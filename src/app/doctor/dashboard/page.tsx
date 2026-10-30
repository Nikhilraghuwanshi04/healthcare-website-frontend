import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { DoctorDashboard } from '@/features/doctors-dashboard/doctor-dashboard';

export const metadata: Metadata = {
  title: 'Doctor dashboard',
  description: 'Your daily numbers and pending booking requests, from the demo dataset.',
};

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Counts and requests come from the mock appointments in this browser — nothing is synced with a real clinic."
      />
      <DoctorDashboard />
    </div>
  );
}
