'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  ExternalLink,
  Inbox,
  ListChecks,
  Stethoscope,
  UserCheck,
} from 'lucide-react';

import { AppointmentCard } from '@/features/appointments/appointment-card';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { useSession } from '@/features/auth/session-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDayLabel } from '@/lib/dates';
import { messageOf } from '@/lib/errors';
import {
  listAppointments,
  updateAppointmentStatus,
} from '@/services/appointment-service';
import { getDoctorStats } from '@/services/stats-service';
import type { Appointment } from '@/types/appointment';

function RequestRow({
  appointment,
  busy,
  onConfirm,
  onConfirmed,
}: {
  appointment: Appointment;
  busy: boolean;
  onConfirm: (appointment: Appointment) => void;
  onConfirmed: () => void;
}) {
  return (
    <AppointmentCard
      appointment={appointment}
      actions={
        <>
          <Button size="sm" loading={busy} onClick={() => onConfirm(appointment)}>
            Confirm
          </Button>
          <CancelAppointmentButton appointment={appointment} actor="doctor" onCancelled={onConfirmed} />
        </>
      }
    />
  );
}

export function DoctorDashboard() {
  const { doctorId, session } = useSession();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const key = doctorId ?? 'none';
  const statsQuery = useAsyncQuery(
    () => (doctorId ? getDoctorStats(doctorId) : Promise.resolve(null)),
    `doctor-stats:${key}`,
  );
  const requestsQuery = useAsyncQuery(
    () =>
      doctorId
        ? listAppointments({ doctorId, statuses: ['pending'], sort: 'soonest' })
        : Promise.resolve([]),
    `doctor-requests:${key}`,
  );

  // The doctor layout already guarantees a doctor session; this only narrows the type.
  if (!doctorId) return null;

  const stats = statsQuery.data;
  const requests = requestsQuery.data ?? [];

  if (statsQuery.error || requestsQuery.error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message="The mock service did not respond. Retry to reload your queue numbers."
        onRetry={() => {
          statsQuery.refetch();
          requestsQuery.refetch();
        }}
      />
    );
  }

  function confirmRequest(appointment: Appointment) {
    setBusyId(appointment.id);
    updateAppointmentStatus(appointment.id, 'confirmed')
      .then(() => {
        toast.success('Request confirmed', `${appointment.reference} now holds a slot in the local demo store.`);
        statsQuery.refetch();
        requestsQuery.refetch();
      })
      .catch((error: unknown) => {
        toast.error('Could not confirm', messageOf(error, 'Please reload the queue and try again.'));
      })
      .finally(() => setBusyId(null));
  }

  if (statsQuery.isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <StatCardSkeleton key={`doctor-stat-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-600">
        Signed in as <span className="font-medium text-ink-900">{session?.displayName}</span> in a mock session.
      </p>

      <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        Demo environment: confirming, completing and cancelling only change local mock records. No patient is notified.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Scheduled today"
          value={stats.todayScheduled}
          icon={<CalendarClock aria-hidden className="h-5 w-5" />}
          hint="Pending or confirmed for today"
        />
        <StatCard
          label="Requests waiting"
          value={stats.pendingRequests}
          tone={stats.pendingRequests > 0 ? 'warning' : 'neutral'}
          icon={<Inbox aria-hidden className="h-5 w-5" />}
          hint="Awaiting your confirmation"
        />
        <StatCard
          label="Upcoming confirmed"
          value={stats.upcomingConfirmed}
          tone="success"
          icon={<CalendarCheck aria-hidden className="h-5 w-5" />}
          hint="Slots already held"
        />
        <StatCard
          label="Completed this month"
          value={stats.completedThisMonth}
          tone="neutral"
          icon={<Stethoscope aria-hidden className="h-5 w-5" />}
          hint="Marked done in the demo"
        />
        <StatCard
          label="Unique patients"
          value={stats.uniquePatients}
          tone="neutral"
          icon={<UserCheck aria-hidden className="h-5 w-5" />}
          hint="Across all appointments"
        />
      </div>

      <Card>
        <CardHeader
          title="Next appointment"
          description={
            stats.nextAppointment ? `On ${formatDayLabel(new Date(stats.nextAppointment.startAt))}` : undefined
          }
          action={
            <Link href="/doctor/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <ListChecks aria-hidden className="h-4 w-4" />
              Open queue
            </Link>
          }
        />
        <CardContent className="space-y-3">
          {stats.nextAppointment ? (
            <AppointmentCard
              appointment={stats.nextAppointment}
              actions={
                <Link
                  href="/doctor/appointments"
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  <ExternalLink aria-hidden className="h-4 w-4" />
                  Manage
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="Nothing upcoming"
              description="When a patient books one of your slots it shows up here, stored in this browser."
              action={
                <Link href="/doctor/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Review clinic profile
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Requests waiting for you"
          description="Booking requests the demo clinic has not confirmed yet."
        />
        <CardContent className="space-y-3">
          {requestsQuery.isLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 2 }, (_, index) => (
                <li key={`doctor-request-skeleton-${index}`}>
                  <Skeleton className="h-28 rounded-card" />
                </li>
              ))}
            </ul>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="Every booking request has been handled. New ones appear in this view."
            />
          ) : (
            requests.map((appointment) => (
              <RequestRow
                key={appointment.id}
                appointment={appointment}
                busy={busyId === appointment.id}
                onConfirm={confirmRequest}
                onConfirmed={() => {
                  statsQuery.refetch();
                  requestsQuery.refetch();
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
