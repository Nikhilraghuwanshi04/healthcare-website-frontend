import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DoctorProfileView } from '@/features/doctors/doctor-profile-view';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Doctor profile',
  description: 'Qualifications, clinic hours and live availability from the demo dataset.',
};

/** `params` may only be read inside a Suspense boundary when cacheComponents is on. */
async function Doctor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorProfileView doctorId={id} />;
}

export default function DoctorPage(props: PageProps<'/doctors/[id]'>) {
  return (
    <Suspense
      fallback={
        <div className="page-container space-y-6 py-10">
          <div className="flex gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-40 rounded-card" />
        </div>
      }
    >
      <Doctor params={props.params} />
    </Suspense>
  );
}
