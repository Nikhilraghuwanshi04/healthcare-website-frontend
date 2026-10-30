'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatClock, formatDayLabel } from '@/lib/dates';
import { listDoctors } from '@/services/doctor-service';

/**
 * Soonest openings in the mock catalogue. Lives on the client because slot
 * availability is derived from the current time, which cannot be read while the
 * home page prerenders.
 */
export function OpenSlotsPanel() {
  const { data, error, isLoading, refetch } = useAsyncQuery(() => listDoctors({ sort: 'soonest' }), 'open-slots');

  if (isLoading) {
    return (
      <div className="relative space-y-3 rounded-card border border-ink-200 bg-white p-5 shadow-raised">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={`open-slot-skeleton-${index}`} className="h-14" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Availability unavailable" message="The mock doctor service did not respond." onRetry={refetch} />
    );
  }

  const soonest = (data ?? []).filter((doctor) => doctor.nextAvailableSlotAt !== null).slice(0, 3);

  return (
    <div className="space-y-4 rounded-card border border-ink-200 bg-white p-5 shadow-raised">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Clock aria-hidden className="h-4 w-4 text-brand-600" />
        Earliest openings
      </p>
      <ul className="space-y-3">
        {soonest.map((doctor) => {
          const start = new Date(doctor.nextAvailableSlotAt ?? '');
          return (
            <li key={doctor.id} className="flex items-center gap-3 rounded-field border border-ink-200 px-3 py-2.5">
              <Avatar name={doctor.name} seed={doctor.id} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{doctor.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {doctor.specialtyName} · {formatDayLabel(start)} {formatClock(start)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <Link href="/doctors?sort=soonest" className="inline-flex text-sm font-medium text-brand-700 hover:underline">
        See all open slots
      </Link>
    </div>
  );
}
