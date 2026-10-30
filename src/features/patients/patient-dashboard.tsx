'use client';

import Link from 'next/link';
import { CalendarCheck, CalendarClock, CalendarPlus, Stethoscope, UserCheck } from 'lucide-react';

import { AppointmentCard } from '@/features/appointments/appointment-card';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { useSession } from '@/features/auth/session-provider';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDayLabel } from '@/lib/dates';
import { listAppointments } from '@/services/appointment-service';
import { getPatientStats } from '@/services/stats-service';

/**
 * Patient home: numbers come from the same service the appointment list uses,
 * so a booking made here is immediately reflected in the stats after refetch.
 */
export function PatientDashboard() {
  const { patientId, session } = useSession();
  const key = patientId ?? 'none';

  const statsQuery = useAsyncQuery(
    () => (patientId ? getPatientStats(patientId) : Promise.resolve(null)),
    `patient-stats:${key}`,
  );
  const upcomingQuery = useAsyncQuery(
    () =>
      patientId
        ? listAppointments({ patientId, statuses: ['pending', 'confirmed'], sort: 'soonest' })
        : Promise.resolve([]),
    `patient-upcoming:${key}`,
  );

  const stats = statsQuery.data;
  const upcoming = upcomingQuery.data ?? [];

  if (statsQuery.error || upcomingQuery.error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message="The mock service did not respond. Retry, or open the appointment list directly."
        onRetry={() => {
          statsQuery.refetch();
          upcomingQuery.refetch();
        }}
      />
    );
  }

  if (statsQuery.isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={`patient-stat-skeleton-${index}`} />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={stats.upcomingCount} icon={<CalendarClock aria-hidden className="h-5 w-5" />} hint="Pending or confirmed" />
        <StatCard label="Awaiting confirmation" value={stats.pendingCount} icon={<CalendarCheck aria-hidden className="h-5 w-5" />} tone={stats.pendingCount > 0 ? 'warning' : 'neutral'} hint="Clinic has not confirmed yet" />
        <StatCard label="Completed visits" value={stats.completedCount} icon={<Stethoscope aria-hidden className="h-5 w-5" />} tone="success" hint={`${stats.cancelledCount} cancelled`} />
        <StatCard label="Doctors consulted" value={stats.doctorsConsulted} icon={<UserCheck aria-hidden className="h-5 w-5" />} tone="neutral" hint="Across all appointments" />
      </div>

      <Card>
        <CardHeader
          title="Next appointment"
          description={stats.nextAppointment ? `On ${formatDayLabel(new Date(stats.nextAppointment.startAt))}` : undefined}
          action={
            <Link href="/patient/book" className={buttonVariants({ size: 'sm' })}>
              <CalendarPlus aria-hidden className="h-4 w-4" />
              Book appointment
            </Link>
          }
        />
        <CardContent className="space-y-3">
          {stats.nextAppointment ? (
            <AppointmentCard
              appointment={stats.nextAppointment}
              detailHref={`/patient/appointments/${stats.nextAppointment.id}`}
              actions={
                <CancelAppointmentButton
                  appointment={stats.nextAppointment}
                  actor="patient"
                  onCancelled={() => {
                    statsQuery.refetch();
                    upcomingQuery.refetch();
                  }}
                />
              }
            />
          ) : (
            <EmptyState
              title="Nothing scheduled"
              description="Book a doctor slot and it will appear here. The booking stays in this browser."
              action={
                <Link href="/doctors" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Find a doctor
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      {upcoming.length > 1 ? (
        <Card>
          <CardHeader
            title="Also coming up"
            description="Everything holding a slot right now."
            action={
              <Link href="/patient/appointments" className="text-sm font-medium text-brand-700 hover:underline">
                All appointments
              </Link>
            }
          />
          <CardContent className="space-y-3">
            {upcoming.slice(1, 4).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                detailHref={`/patient/appointments/${appointment.id}`}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
