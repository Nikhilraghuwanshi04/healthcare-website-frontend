import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { AppointmentDetail } from '@/features/patients/appointment-detail';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Appointment details',
  description: 'The full mock record for one appointment.',
};

/** `params` may only be read inside a Suspense boundary when cacheComponents is on. */
async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppointmentDetail appointmentId={id} />;
}

export default function AppointmentDetailPage(props: PageProps<'/patient/appointments/[id]'>) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment details"
        back={{ href: '/patient/appointments', label: 'My appointments' }}
      />
      <Suspense fallback={<Skeleton className="h-72 rounded-card" />}>
        <Detail params={props.params} />
      </Suspense>
    </div>
  );
}
