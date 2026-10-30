'use client';

import { useState } from 'react';
import { Check, Search } from 'lucide-react';

import { AppointmentStatusBadge, MODE_LABEL } from '@/features/appointments/appointment-status';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { useSession } from '@/features/auth/session-provider';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import {
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { addDays, formatDayLabel, formatTimeRange, startOfDay } from '@/lib/dates';
import { messageOf } from '@/lib/errors';
import {
  applyAppointmentFilters,
  listAppointments,
  updateAppointmentStatus,
} from '@/services/appointment-service';
import type { Appointment, AppointmentListFilter } from '@/types/appointment';

export type DoctorQueueTab =
  | 'today'
  | 'upcoming'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'all';

const TABS: { value: DoctorQueueTab; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

/** Kept pure so the tab contract is unit-testable without React. */
export function tabFilterOf(tab: DoctorQueueTab, now: Date): AppointmentListFilter {
  const midnight = startOfDay(now);
  switch (tab) {
    case 'today':
      return { from: midnight.toISOString(), to: addDays(midnight, 1).toISOString() };
    case 'upcoming':
      return { statuses: ['pending', 'confirmed'], from: now.toISOString() };
    case 'pending':
      return { statuses: ['pending'] };
    case 'confirmed':
      return { statuses: ['confirmed'] };
    case 'completed':
      return { statuses: ['completed'] };
    case 'cancelled':
      return { statuses: ['cancelled'] };
    default:
      return {};
  }
}

function QueueActions({
  appointment,
  busy,
  onTransition,
  onTransitioned,
}: {
  appointment: Appointment;
  busy: boolean;
  onTransition: (appointment: Appointment, status: 'confirmed' | 'completed') => void;
  onTransitioned: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {appointment.status === 'pending' ? (
        <Button size="sm" loading={busy} onClick={() => onTransition(appointment, 'confirmed')}>
          Confirm
        </Button>
      ) : null}
      {appointment.status === 'confirmed' ? (
        <Button size="sm" loading={busy} onClick={() => onTransition(appointment, 'completed')}>
          <Check aria-hidden className="h-4 w-4" />
          Mark completed
        </Button>
      ) : null}
      {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
        <CancelAppointmentButton appointment={appointment} actor="doctor" onCancelled={onTransitioned} />
      ) : null}
    </div>
  );
}

export function DoctorAppointmentQueue() {
  const { doctorId } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<DoctorQueueTab>('today');
  const [sort, setSort] = useState<'soonest' | 'latest'>('soonest');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useAsyncQuery(
    () => (doctorId ? listAppointments({ doctorId }) : Promise.resolve([])),
    `doctor-queue:${doctorId ?? 'none'}`,
  );

  // The doctor layout already guarantees a doctor session; this only narrows the type.
  if (!doctorId) return null;

  const all = query.data ?? [];
  const now = new Date();
  const visible = applyAppointmentFilters(all, {
    ...tabFilterOf(tab, now),
    search: search || undefined,
    sort,
  });

  const countFor = (value: DoctorQueueTab) =>
    applyAppointmentFilters(all, { ...tabFilterOf(value, now), search: search || undefined }).length;

  function runTransition(appointment: Appointment, status: 'confirmed' | 'completed') {
    setBusyId(appointment.id);
    updateAppointmentStatus(appointment.id, status)
      .then(() => {
        toast.success(
          status === 'confirmed' ? 'Appointment confirmed' : 'Marked as completed',
          `${appointment.reference} now has status "${status}" in the local demo store.`,
        );
        query.refetch();
      })
      .catch((error: unknown) => {
        toast.error('Could not update status', messageOf(error, 'Please reload the queue and try again.'));
      })
      .finally(() => setBusyId(null));
  }

  if (query.error) {
    return <ErrorState title="Queue unavailable" message="The mock service did not respond." onRetry={query.refetch} />;
  }

  return (
    <div className="space-y-5">
      <SegmentedControl
        label="Filter appointment queue"
        value={tab}
        onChange={setTab}
        options={TABS.map((item) => ({ value: item.value, label: item.label, count: countFor(item.value) }))}
      />

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(term.trim());
          }}
          className="flex max-w-md flex-1 gap-2"
        >
          <label htmlFor="queue-search" className="sr-only">
            Search queue by patient, reference or reason
          </label>
          <Input
            id="queue-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search patient, reference or reason"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search aria-hidden className="h-4 w-4" />
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <label htmlFor="queue-sort" className="text-sm text-ink-600">
            Sort
          </label>
          <Select
            id="queue-sort"
            className="w-auto"
            value={sort}
            onChange={(event) => setSort(event.target.value === 'latest' ? 'latest' : 'soonest')}
          >
            <option value="soonest">Soonest first</option>
            <option value="latest">Latest first</option>
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <Table caption="Appointment queue for this doctor">
          <TBody>
            {Array.from({ length: 4 }, (_, index) => (
              <TableRowSkeleton key={`doctor-queue-skeleton-${index}`} columns={6} />
            ))}
          </TBody>
        </Table>
      ) : visible.length === 0 ? (
        <EmptyState
          title={search ? 'No appointment matches that search' : 'Nothing in this view'}
          description={
            search
              ? 'Clear the search or switch tabs. Matching checks patient name, reference and reason.'
              : 'Bookings made against your slots appear here. Everything lives in this browser.'
          }
          action={
            search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTerm('');
                  setSearch('');
                }}
              >
                Clear search
              </Button>
            ) : null
          }
        />
      ) : (
        <Table caption="Appointment queue for this doctor">
          <THead>
            <Tr>
              <Th>Patient</Th>
              <Th>Date &amp; time</Th>
              <Th>Mode</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {visible.map((appointment) => (
              <Tr key={appointment.id}>
                <Td>
                  <span className="block font-medium text-ink-900">{appointment.patientName}</span>
                  <span className="block text-xs text-ink-500">{appointment.patientPhone}</span>
                </Td>
                <Td>
                  <span className="block">{formatDayLabel(new Date(appointment.startAt), now)}</span>
                  <span className="block text-xs text-ink-500">
                    {formatTimeRange(appointment.startAt, appointment.durationMinutes)}
                  </span>
                </Td>
                <Td>{MODE_LABEL[appointment.mode]}</Td>
                <Td>
                  <span className="line-clamp-2 max-w-56">{appointment.reason}</span>
                  <span className="block text-xs text-ink-500">{appointment.reference}</span>
                </Td>
                <Td>
                  <AppointmentStatusBadge status={appointment.status} />
                </Td>
                <Td>
                  <QueueActions
                    appointment={appointment}
                    busy={busyId === appointment.id}
                    onTransition={runTransition}
                    onTransitioned={query.refetch}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <p className="text-xs text-ink-500">
        Showing {visible.length} of {all.length} appointment{all.length === 1 ? '' : 's'} for this doctor.
      </p>
    </div>
  );
}
