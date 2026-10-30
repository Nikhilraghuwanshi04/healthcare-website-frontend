import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { BookingWizard } from '@/features/appointments/booking-wizard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Book an appointment',
  description: 'Choose a doctor, a time and confirm the details in four steps.',
};

export default function BookAppointmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an appointment"
        description={
          <>
            Four steps: doctor, time, patient details, review.{' '}
            <span className="font-medium text-ink-800">This is a demo</span> — confirming stores the booking in this
            browser only, and no clinic, payment or message is involved.
          </>
        }
        back={{ href: '/patient/dashboard', label: 'Back to dashboard' }}
      />
      {/* The wizard reads ?doctorId=, so it needs a Suspense boundary under cacheComponents. */}
      <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
        <BookingWizard />
      </Suspense>
    </div>
  );
}
