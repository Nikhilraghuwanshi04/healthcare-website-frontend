'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { AppointmentStatusBadge, MODE_LABEL } from '@/features/appointments/appointment-status';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { applyAppointmentFilters, listAppointments, updateAppointmentStatus } from '@/services/appointment-service';
import { addDays, addMinutes, formatDateTime, fromIsoDate, startOfDay } from '@/lib/dates';
import { messageOf } from '@/lib/errors';
import { formatINR } from '@/lib/utils';
import type { Appointment, AppointmentSortKey, AppointmentStatus } from '@/types/appointment';

export type AppointmentTab = 'all' | AppointmentStatus;

export type AdminAppointmentAction = 'confirmed' | 'completed';

export const APPOINTMENT_TABS: AppointmentTab[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const TAB_LABEL: Record<AppointmentTab, string> = {
  all: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const SORT_OPTIONS: { value: AppointmentSortKey; label: string }[] = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'patient_name', label: 'Patient name (A–Z)' },
];

export function statusesForTab(tab: AppointmentTab): AppointmentStatus[] | undefined {
  return tab === 'all' ? undefined : [tab];
}

/**
 * The whole demo lives in the browser's own timezone, so a date range is built
 * from local calendar days: `from` is that day's first minute, `to` the minute
 * before the next day starts. No timezone conversion is attempted.
 */
export function toAppointmentBounds(from: string, to: string): { from: string | null; to: string | null } {
  return {
    from: from ? startOfDay(fromIsoDate(from)).toISOString() : null,
    to: to ? addMinutes(addDays(startOfDay(fromIsoDate(to)), 1), -1).toISOString() : null,
  };
}

export function AdminAppointmentsTable() {
  const toast = useToast();
  const [tab, setTab] = useState<AppointmentTab>('all');
  const [doctorId, setDoctorId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<AppointmentSortKey>('soonest');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const appointmentsQuery = useAsyncQuery(() => listAppointments(), 'admin-appointments');
  const all = appointmentsQuery.data ?? [];
  const bounds = toAppointmentBounds(fromDate, toDate);

  const visible = applyAppointmentFilters(all, {
    statuses: statusesForTab(tab),
    doctorId: doctorId || null,
    search: search || undefined,
    from: bounds.from,
    to: bounds.to,
    sort,
  });

  const doctorOptions = Array.from(
    new Map(all.map((appointment) => [appointment.doctorId, appointment.doctorName])).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  function moveStatus(appointment: Appointment, next: AdminAppointmentAction) {
    setPendingId(appointment.id);

    updateAppointmentStatus(appointment.id, next)
      .then(() => {
        toast.success(
          next === 'confirmed' ? 'Marked confirmed (demo)' : 'Marked completed (demo)',
          `${appointment.reference} changed in the local mock store only. No patient, doctor or message is involved.`,
        );
      })
      .catch((error: unknown) => {
        toast.error('That status change was refused', messageOf(error, 'Please try again.'));
      })
      .finally(() => {
        setPendingId(null);
        appointmentsQuery.refetch();
      });
  }

  function resetFilters() {
    setTerm('');
    setSearch('');
    setDoctorId('');
    setFromDate('');
    setToDate('');
  }

  if (appointmentsQuery.error) {
    return (
      <ErrorState
        title="Appointments unavailable"
        message="The mock appointment service did not respond. Try again."
        onRetry={appointmentsQuery.refetch}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SegmentedControl<AppointmentTab>
        label="Filter appointments by status"
        value={tab}
        onChange={setTab}
        options={APPOINTMENT_TABS.map((option) => ({
          value: option,
          label: TAB_LABEL[option],
          count: applyAppointmentFilters(all, { statuses: statusesForTab(option) }).length,
        }))}
      />

      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(term.trim());
          }}
          className="flex w-full max-w-sm gap-2"
        >
          <label htmlFor="admin-appointment-search" className="sr-only">
            Search appointments by patient, doctor, reference or reason
          </label>
          <Input
            id="admin-appointment-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search patient, doctor, reference"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search aria-hidden className="h-4 w-4" />
            Search
          </Button>
        </form>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">Doctor</span>
          <Select value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
            <option value="">All doctors</option>
            {doctorOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">From</span>
          <Input
            id="admin-appointment-from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">To</span>
          <Input
            id="admin-appointment-to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">Sort by</span>
          <Select value={sort} onChange={(event) => setSort(event.target.value as AppointmentSortKey)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset filters
        </Button>
      </div>

      {appointmentsQuery.isLoading ? (
        <Table caption="Loading the mock appointment queue">
          <THead>
            <AppointmentHead />
          </THead>
          <TBody>
            {Array.from({ length: 6 }, (_, index) => (
              <TableRowSkeleton key={`admin-appointment-skeleton-${index}`} columns={8} />
            ))}
          </TBody>
        </Table>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No appointment matches these filters"
          description="Change the status tab, widen the date range, or reset the filters to see the whole demo queue."
        />
      ) : (
        <Table caption="Every mock appointment with its current status">
          <THead>
            <AppointmentHead />
          </THead>
          <TBody>
            {visible.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                pending={pendingId === appointment.id}
                onMove={(next) => moveStatus(appointment, next)}
                onDone={appointmentsQuery.refetch}
              />
            ))}
          </TBody>
        </Table>
      )}

      <p className="text-xs text-ink-500">
        Showing {visible.length} of {all.length} mock appointment{all.length === 1 ? '' : 's'}. Status changes and
        cancellations write to this browser only — nobody is notified and no payment is taken.
      </p>
    </div>
  );
}

function AppointmentHead() {
  return (
    <Tr>
      <Th>Reference</Th>
      <Th>Patient</Th>
      <Th>Doctor</Th>
      <Th>When</Th>
      <Th>Mode</Th>
      <Th>Fee</Th>
      <Th>Status</Th>
      <Th>Actions</Th>
    </Tr>
  );
}

function AppointmentRow({
  appointment,
  pending,
  onMove,
  onDone,
}: {
  appointment: Appointment;
  pending: boolean;
  onMove: (next: AdminAppointmentAction) => void;
  onDone: () => void;
}) {
  const cancellable = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <Tr>
      <Td className="font-medium text-ink-900">{appointment.reference}</Td>
      <Td>
        {appointment.patientName}
        <span className="block text-xs text-ink-500">{appointment.patientPhone}</span>
      </Td>
      <Td>
        {appointment.doctorName}
        <span className="block text-xs text-ink-500">{appointment.doctorSpecialtyName}</span>
      </Td>
      <Td>
        {formatDateTime(appointment.startAt)}
        <span className="block text-xs text-ink-500">{appointment.durationMinutes} min</span>
      </Td>
      <Td>{MODE_LABEL[appointment.mode]}</Td>
      <Td>{formatINR(appointment.consultationFeeInr)}</Td>
      <Td>
        <AppointmentStatusBadge status={appointment.status} />
      </Td>
      <Td>
        <div className="flex flex-wrap gap-2">
          {appointment.status === 'pending' ? (
            <Button size="sm" loading={pending} onClick={() => onMove('confirmed')}>
              Confirm
            </Button>
          ) : null}
          {appointment.status === 'confirmed' ? (
            <Button variant="outline" size="sm" loading={pending} onClick={() => onMove('completed')}>
              Mark completed
            </Button>
          ) : null}
          {cancellable ? (
            <CancelAppointmentButton appointment={appointment} actor="admin" onCancelled={onDone} />
          ) : null}
        </div>
      </Td>
    </Tr>
  );
}
