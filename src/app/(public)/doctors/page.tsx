import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { DoctorDirectory } from '@/features/doctors/doctor-directory';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConsultationMode } from '@/types/common';
import type { DoctorSearchQuery, DoctorSortKey } from '@/types/doctor';

export const metadata: Metadata = {
  title: 'Find a doctor',
  description: 'Search the demo clinic network by specialty, city, fee and consultation mode.',
};

const SORT_KEYS: DoctorSortKey[] = ['rating', 'soonest', 'fee_asc', 'fee_desc', 'experience'];
const MODE_KEYS: ConsultationMode[] = ['in_person', 'video'];

/** Reads the shareable filter URL (?specialtyId=cardiology&sort=soonest) into a service query. */
function toInitialQuery(searchParams: Record<string, string | string[] | undefined>): DoctorSearchQuery {
  const text = (value: string | string[] | undefined): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

  const sort = text(searchParams.sort);
  const maxFee = Number(text(searchParams.maxFee));
  const modes = (searchParams.modes ?? '')
    .toString()
    .split(',')
    .filter((mode): mode is ConsultationMode => MODE_KEYS.includes(mode as ConsultationMode));

  return {
    search: text(searchParams.search),
    specialtyId: text(searchParams.specialtyId) ?? null,
    city: text(searchParams.city) ?? null,
    maxFeeInr: Number.isFinite(maxFee) && maxFee > 0 ? maxFee : null,
    modes: modes.length > 0 ? modes : undefined,
    acceptingNewPatientsOnly: text(searchParams.accepting) === 'true' ? true : undefined,
    sort: SORT_KEYS.includes(sort as DoctorSortKey) ? (sort as DoctorSortKey) : 'rating',
  };
}

/** searchParams must be read inside a Suspense boundary when cacheComponents is on. */
async function Directory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DoctorDirectory initialQuery={toInitialQuery(await searchParams)} />;
}

export default function DoctorsPage(props: PageProps<'/doctors'>) {
  return (
    <div className="page-container space-y-8 py-10">
      <PageHeader
        title="Find a doctor"
        description="Search the demo clinic network. Filters and sorting run through the mock doctor service, so results update without a page reload."
      />
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Skeleton className="h-96 rounded-card" />
            <ul className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={`directory-pending-${index}`}>
                  <Skeleton className="h-56" />
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <Directory searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
