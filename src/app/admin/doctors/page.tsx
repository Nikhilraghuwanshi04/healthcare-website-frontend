import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { AdminDoctorsTable } from '@/features/admin/admin-doctors-table';

export const metadata: Metadata = {
  title: 'Admin doctors',
  description: 'Search, edit and add doctor records in the demo directory, including the verification flag.',
};

export default function AdminDoctorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Create and maintain the demo directory. Saving writes to the local mock store only: no login is provisioned, no email is sent and the verification flag is a demo label, not a credential check."
      />
      <AdminDoctorsTable />
    </div>
  );
}
