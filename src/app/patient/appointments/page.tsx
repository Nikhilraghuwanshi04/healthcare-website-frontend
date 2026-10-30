import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { PatientAppointments } from '@/features/patients/patient-appointments';

export const metadata: Metadata = {
  title: 'My appointments',
  description: 'Filter, search and cancel the appointments stored in the demo.',
};

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My appointments"
        description="Every booking made in this browser, with the status the mock clinic would set."
      />
      <PatientAppointments />
    </div>
  );
}
