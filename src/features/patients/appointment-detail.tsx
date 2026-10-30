'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { AppointmentStatusBadge, MODE_LABEL, STATUS_META } from '@/features/appointments/appointment-status';
import { CancelAppointmentButton } from '@/features/appointments/cancel-appointment-button';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dates';
import { formatINR } from '@/lib/utils';
import { getAppointment } from '@/services/appointment-service';
import type { Appointment } from '@/types/appointment';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-sm text-ink-900">{children}</dd>
    </div>
  );
}

function Detail({ appointment }: { appointment: Appointment }) {
  const cancellable = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={`${appointment.doctorName} · ${appointment.doctorSpecialtyName}`}
          description={STATUS_META[appointment.status].note}
          action={<AppointmentStatusBadge status={appointment.status} />}
        />
        <CardContent className="flex items-center gap-4">
          <Avatar name={appointment.doctorName} seed={appointment.doctorId} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-900">{formatDateTime(appointment.startAt)}</p>
            <p className="text-sm text-ink-600">
              {formatTimeRange(appointment.startAt, appointment.durationMinutes)} · {MODE_LABEL[appointment.mode]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/doctors/${appointment.doctorId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Doctor profile
            </Link>
            {cancellable ? <CancelAppointmentButton appointment={appointment} actor="patient" size="sm" /> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Appointment record" description={`Reference ${appointment.reference}`} />
        <CardContent>
          <dl className="divide-y divide-ink-200">
            <Row label="Patient">{appointment.patientName}</Row>
            <Row label="Contact">{appointment.patientPhone} · {appointment.patientEmail}</Row>
            <Row label="Date">{formatDate(new Date(appointment.startAt))}</Row>
            <Row label="Duration">{appointment.durationMinutes} minutes</Row>
            <Row label="Consultation mode">{MODE_LABEL[appointment.mode]}</Row>
            <Row label="Fee">{formatINR(appointment.consultationFeeInr)} — payable at the clinic</Row>
            <Row label="Reason">{appointment.reason}</Row>
            <Row label="Booked on">{formatDateTime(appointment.createdAt)}</Row>
            {appointment.status === 'cancelled' && appointment.cancelledAt ? (
              <>
                <Row label="Cancelled on">{formatDateTime(appointment.cancelledAt)}</Row>
                <Row label="Cancelled by">{appointment.cancelledBy}</Row>
                <Row label="Reason given">{appointment.cancellationReason}</Row>
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        This record lives in this browser&apos;s mock store. No reminder, email or SMS has been sent, and no payment has
        been taken.
      </p>

      <Link href="/patient/appointments" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Back to all appointments
      </Link>
    </div>
  );
}

export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const query = useAsyncQuery(() => getAppointment(appointmentId), `appointment:${appointmentId}`);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <ErrorState
        title="Appointment not found"
        message="This record is not in the mock store — it may have been reset with the demo data."
        onRetry={query.refetch}
      />
    );
  }

  return <Detail appointment={query.data} />;
}
