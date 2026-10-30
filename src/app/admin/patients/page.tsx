import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { AdminPatientsTable } from '@/features/admin/admin-patients-table';

export const metadata: Metadata = {
  title: 'Admin patients',
  description: 'Read-only register of the mock patient records held in this browser.',
};

export default function AdminPatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Read-only on purpose: patients update their own details through their account, so this list shows the stored values as they are and adds no interpretation or clinical summary."
      />
      <AdminPatientsTable />
    </div>
  );
}
