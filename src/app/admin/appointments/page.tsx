import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { AdminAppointmentsTable } from '@/features/admin/admin-appointments-table';

export const metadata: Metadata = {
  title: 'Admin appointments',
  description: 'Filter every mock appointment by status, doctor, date range or search and update its status.',
};

export default function AdminAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="The full demo queue. Confirming, completing or cancelling changes the local record only — no patient or doctor is contacted and no payment is taken."
      />
      <AdminAppointmentsTable />
    </div>
  );
}
