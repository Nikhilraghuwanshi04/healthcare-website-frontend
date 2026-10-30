'use client';

import { DoctorCard } from './doctor-card';
import { DoctorCardSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { listDoctors } from '@/services/doctor-service';

/** Highest rated doctors, refreshed from the mock store on the client. */
export function FeaturedDoctors() {
  const { data, error, isLoading } = useAsyncQuery(() => listDoctors({ sort: 'rating' }), 'featured-doctors');

  if (isLoading) {
    return (
      <ul className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={`featured-skeleton-${index}`}>
            <DoctorCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return <ErrorState message="The doctor list could not be loaded. Refresh the page to try again." />;
  }

  const featured = (data ?? []).slice(0, 3);

  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {featured.map((doctor) => (
        <li key={doctor.id}>
          <DoctorCard doctor={doctor} />
        </li>
      ))}
    </ul>
  );
}
