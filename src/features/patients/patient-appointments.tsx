'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, Search } from 'lucide-react';

import { AppointmentCard } from '@/features/appointments/appointment-card';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { useSession } from '@/features/auth/session-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { applyAppointmentFilters, listAppointments } from '@/services/appointment-service';
import type { AppointmentStatus } from '@/types/appointment';

type Tab = 'upcoming' | 'all' | AppointmentStatus;

const TABS: { value: Tab; label: string; statuses?: AppointmentStatus[]; upcomingOnly?: boolean }[] = [
  { value: 'upcoming', label: 'Upcoming', statuses: ['pending', 'confirmed'], upcomingOnly: true },
  { value: 'pending', label: 'Pending', statuses: ['pending'] },
  { value: 'confirmed', label: 'Confirmed', statuses: ['confirmed'] },
  { value: 'completed', label: 'Completed', statuses: ['completed'] },
  { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
  { value: 'all', label: 'All' },
];

/** Kept in one place so the tab behaviour is unit-testable without React. */
export function tabDefinitionOf(tab: Tab) {
  return TABS.find((item) => item.value === tab) ?? TABS[0];
}

export function PatientAppointments() {
  const { patientId } = useSession();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');

  const query = useAsyncQuery(
    () => (patientId ? listAppointments({ patientId }) : Promise.resolve([])),
    `patient-appointments:${patientId ?? 'none'}`,
  );

  const all = query.data ?? [];
  const definition = tabDefinitionOf(tab);
  const now = new Date().toISOString();
  const visible = applyAppointmentFilters(all, {
    statuses: definition.statuses,
    search: search || undefined,
    from: definition.upcomingOnly ? now : null,
    sort: definition.upcomingOnly ? 'soonest' : 'latest',
  });

  const countFor = (value: Tab) => {
    const item = tabDefinitionOf(value);
    return applyAppointmentFilters(all, { statuses: item.statuses, from: item.upcomingOnly ? now : null }).length;
  };

  if (query.error) {
    return (
      <ErrorState title="Appointments unavailable" message="The mock service did not respond." onRetry={query.refetch} />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Filter appointments"
          value={tab}
          onChange={setTab}
          options={TABS.map((item) => ({ value: item.value, label: item.label, count: countFor(item.value) }))}
        />
        <Link href="/patient/book" className={buttonVariants({ size: 'sm' })}>
          <CalendarPlus aria-hidden className="h-4 w-4" />
          Book appointment
        </Link>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(term.trim());
        }}
        className="flex max-w-md gap-2"
      >
        <label htmlFor="appointment-search" className="sr-only">
          Search appointments by doctor, reference or reason
        </label>
        <Input
          id="appointment-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search doctor, reference or reason"
        />
        <Button type="submit" variant="outline" size="sm">
          <Search aria-hidden className="h-4 w-4" />
          Search
        </Button>
      </form>

      {query.isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={`appointment-skeleton-${index}`}>
              <Skeleton className="h-28 rounded-card" />
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyState
          title={search ? 'No appointment matches that search' : 'No appointments in this view'}
          description={
            search
              ? 'Clear the search or switch tab. Matching checks the doctor name, reference and reason.'
              : 'Bookings you make in this demo appear here, because everything is stored in this browser.'
          }
          action={
            search ? (
              <button
                type="button"
                onClick={() => {
                  setTerm('');
                  setSearch('');
                }}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Clear search
              </button>
            ) : (
              <Link href="/patient/book" className={buttonVariants({ size: 'sm' })}>
                Book an appointment
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((appointment) => {
            const cancellable = appointment.status === 'pending' || appointment.status === 'confirmed';
            return (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  detailHref={`/patient/appointments/${appointment.id}`}
                  actions={
                    cancellable ? (
                      <CancelAppointmentButton appointment={appointment} actor="patient" onCancelled={query.refetch} />
                    ) : null
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-ink-500">
        Showing {visible.length} of {all.length} mock appointment{all.length === 1 ? '' : 's'} for this account.
      </p>
    </div>
  );
}
