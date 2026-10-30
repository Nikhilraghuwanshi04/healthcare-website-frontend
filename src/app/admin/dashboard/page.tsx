import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { AdminOverview } from '@/features/admin/admin-overview';

export const metadata: Metadata = {
  title: 'Admin overview',
  description: 'Clinic-wide counts from the mock store: doctor records, patients and appointment activity.',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Every figure is counted from the local mock data in this browser. Nothing here contacts a patient, a doctor or a clinic."
      />
      <AdminOverview />
    </div>
  );
}
