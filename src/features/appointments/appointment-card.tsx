import Link from 'next/link';
import { Clock, Video } from 'lucide-react';

import { AppointmentStatusBadge, MODE_LABEL, STATUS_META } from './appointment-status';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { formatDayLabel, formatTimeRange } from '@/lib/dates';
import { formatINR } from '@/lib/utils';
import type { Appointment } from '@/types/appointment';
import type { ReactNode } from 'react';

/**
 * Patient-facing appointment row. Detail navigation is always present; the
 * action slot is supplied by the page (cancel, reschedule, mark arrived…).
 */
export function AppointmentCard({
  appointment,
  detailHref,
  actions,
}: {
  appointment: Appointment;
  detailHref?: string;
  actions?: ReactNode;
}) {
  const start = new Date(appointment.startAt);

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <Avatar name={appointment.doctorName} seed={appointment.doctorId} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink-900">{appointment.doctorName}</h3>
          <span className="text-sm text-ink-500">{appointment.doctorSpecialtyName}</span>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="h-4 w-4 text-ink-400" />
            {formatDayLabel(start)} · {formatTimeRange(appointment.startAt, appointment.durationMinutes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {appointment.mode === 'video' ? <Video aria-hidden className="h-4 w-4 text-ink-400" /> : null}
            {MODE_LABEL[appointment.mode]}
          </span>
          <span>{formatINR(appointment.consultationFeeInr)} at clinic</span>
        </p>
        <p className="line-clamp-1 text-sm text-ink-500">
          {appointment.reference} · {appointment.reason}
        </p>
        {appointment.status === 'cancelled' && appointment.cancellationReason ? (
          <p className="text-sm text-rose-700">
            {STATUS_META.cancelled.note} Reason: {appointment.cancellationReason}.
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
        {detailHref ? (
          <Link
            href={detailHref}
            className="rounded-field border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Details
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
