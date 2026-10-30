import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { PatientDashboard } from '@/features/patients/patient-dashboard';

export const metadata: Metadata = {
  title: 'Patient dashboard',
  description: 'Your upcoming visits and booking summary, calculated from the demo dataset.',
};

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Counts are derived from the mock appointments in this browser — nothing is synced with a clinic."
      />
      <PatientDashboard />
    </div>
  );
}
