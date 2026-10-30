import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { DoctorAppointmentQueue } from '@/features/doctors-dashboard/doctor-appointment-queue';

export const metadata: Metadata = {
  title: 'Appointment queue',
  description: 'Filter, search, confirm and complete the booking requests stored in the demo.',
};

export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment queue"
        description="Every request and booking against your slots. Status changes stay in this browser and notify no one."
      />
      <DoctorAppointmentQueue />
    </div>
  );
}
