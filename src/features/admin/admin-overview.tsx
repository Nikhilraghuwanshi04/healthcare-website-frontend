'use client';

import Link from 'next/link';
import {
  Activity,
  Ban,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';

import { AppointmentStatusBadge } from '@/features/appointments/appointment-status';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDateTime } from '@/lib/dates';
import { getAdminStats } from '@/services/stats-service';
import type { Appointment } from '@/types/appointment';
import type { SpecialtyLoad } from '@/types/stats';

/**
 * Clinic-wide numbers for the admin portal. Everything is counted from the mock
 * store, so a figure only moves when someone books or edits in this browser.
 */
export function AdminOverview() {
  const statsQuery = useAsyncQuery(getAdminStats, 'admin-stats');

  if (statsQuery.error) {
    return (
      <ErrorState
        title="Overview unavailable"
        message="The mock statistics service did not respond. Try again."
        onRetry={statsQuery.refetch}
      />
    );
  }

  const stats = statsQuery.data;

  if (statsQuery.isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }, (_, index) => (
            <StatCardSkeleton key={`admin-stat-skeleton-${index}`} />
          ))}
        </div>
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        Demo environment: every figure below is counted from the local mock store. No patient, doctor or clinic is
        contacted and no notification is sent.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doctor records"
          value={stats.totalDoctors}
          icon={<Stethoscope aria-hidden className="h-5 w-5" />}
          hint="In the demo directory"
        />
        <StatCard
          label="Accepting new patients"
          value={stats.activeDoctors}
          tone="success"
          icon={<UserCheck aria-hidden className="h-5 w-5" />}
          hint={`${stats.totalDoctors - stats.activeDoctors} flagged not accepting`}
        />
        <StatCard
          label="Patient records"
          value={stats.totalPatients}
          tone="neutral"
          icon={<Users aria-hidden className="h-5 w-5" />}
          hint="Across all demo accounts"
        />
        <StatCard
          label="Appointments"
          value={stats.totalAppointments}
          icon={<CalendarDays aria-hidden className="h-5 w-5" />}
          hint="Every status, all time"
        />
        <StatCard
          label="Scheduled this week"
          value={stats.appointmentsThisWeek}
          tone="neutral"
          icon={<CalendarClock aria-hidden className="h-5 w-5" />}
          hint="Pending or confirmed, next 7 days"
        />
        <StatCard
          label="Awaiting confirmation"
          value={stats.pendingRequests}
          tone={stats.pendingRequests > 0 ? 'warning' : 'neutral'}
          icon={<CalendarCheck aria-hidden className="h-5 w-5" />}
          hint="Requests the clinic has not accepted"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelledCount}
          tone="danger"
          icon={<Ban aria-hidden className="h-5 w-5" />}
          hint="Slots released back to the store"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SpecialtyLoadCard loads={stats.specialtyLoad} totalAppointments={stats.totalAppointments} />
        <RecentActivityCard appointments={stats.recentAppointments} />
      </div>
    </div>
  );
}

function SpecialtyLoadCard({ loads, totalAppointments }: { loads: SpecialtyLoad[]; totalAppointments: number }) {
  const peak = loads.length > 0 ? loads[0].appointmentCount : 0;

  return (
    <Card>
      <CardHeader title="Specialty load" description="Appointments grouped by the specialty stored on each booking." />
      <CardContent>
        {loads.length === 0 ? (
          <EmptyState
            title="No appointments to weigh up"
            description="Specialty totals appear as soon as the mock store holds bookings."
          />
        ) : (
          <ul className="space-y-4">
            {loads.map((load) => (
              <SpecialtyLoadBar key={load.specialtyName} load={load} peak={peak} total={totalAppointments} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Plain accessible bars: a width-driven div plus visible and screen-reader counts. */
function SpecialtyLoadBar({ load, peak, total }: { load: SpecialtyLoad; peak: number; total: number }) {
  const barWidth = peak > 0 ? Math.round((load.appointmentCount / peak) * 100) : 0;
  const share = total > 0 ? Math.round((load.appointmentCount / total) * 100) : 0;

  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-800">{load.specialtyName}</span>
        <span className="text-ink-600">{load.appointmentCount}</span>
      </div>
      <div aria-hidden className="h-2 rounded-full bg-ink-100">
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${barWidth}%` }} />
      </div>
      <span className="sr-only">
        {load.specialtyName}: {load.appointmentCount} of {total} appointments, {share} percent of the total.
      </span>
    </li>
  );
}

function RecentActivityCard({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardHeader
        title="Recent activity"
        description="Newest mock bookings first, straight from the store."
        action={
          <Link href="/admin/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Activity aria-hidden className="h-4 w-4" />
            All appointments
          </Link>
        }
      />
      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <EmptyState
            title="Nothing scheduled yet"
            description="Recent bookings appear here once the mock store has appointments."
          />
        ) : (
          <Table caption="Five most recently created mock appointments">
            <THead>
              <Tr>
                <Th>Patient</Th>
                <Th>Doctor</Th>
                <Th>When</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {appointments.map((appointment) => (
                <Tr key={appointment.id}>
                  <Td className="font-medium text-ink-900">{appointment.patientName}</Td>
                  <Td>
                    {appointment.doctorName}
                    <span className="block text-xs text-ink-500">{appointment.doctorSpecialtyName}</span>
                  </Td>
                  <Td>{formatDateTime(appointment.startAt)}</Td>
                  <Td>
                    <AppointmentStatusBadge status={appointment.status} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
