import Link from 'next/link';
import { CalendarClock, MapPin, Star } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { MODE_LABEL } from '@/features/appointments/appointment-status';
import { formatClock, formatDayLabel } from '@/lib/dates';
import { cn, formatINR } from '@/lib/utils';
import type { DoctorSummary } from '@/types/doctor';

export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const nextSlot = doctor.nextAvailableSlotAt ? new Date(doctor.nextAvailableSlotAt) : null;

  return (
    <article className="card-surface flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <Avatar name={doctor.name} seed={doctor.id} size="lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-base font-semibold text-ink-900">
            <Link href={`/doctors/${doctor.id}`} className="hover:text-brand-700">
              {doctor.name}
            </Link>
          </h3>
          <p className="text-sm text-ink-500">{doctor.credentials}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="brand">{doctor.specialtyName}</Badge>
            {doctor.rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-ink-600">
                <Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <strong className="font-semibold text-ink-900">{doctor.rating.toFixed(1)}</strong>
                <span className="text-ink-500">({doctor.reviewCount})</span>
              </span>
            ) : (
              <span className="text-ink-500">New profile</span>
            )}
            <span className="text-ink-500">{doctor.experienceYears} yrs exp.</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-ink-600">
        <p className="flex items-center gap-2">
          <MapPin aria-hidden className="h-4 w-4 shrink-0 text-ink-400" />
          {doctor.city} · {formatINR(doctor.consultationFeeInr)} visit
        </p>
        <p className="flex items-center gap-2">
          <CalendarClock aria-hidden className="h-4 w-4 shrink-0 text-ink-400" />
          {nextSlot ? (
            <>
              Next slot {formatDayLabel(nextSlot)} at {formatClock(nextSlot)}
            </>
          ) : (
            'No slots in the next three weeks'
          )}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {doctor.modes.map((mode) => (
            <Badge key={mode} tone="neutral">
              {MODE_LABEL[mode]}
            </Badge>
          ))}
          {!doctor.acceptingNewPatients ? <Badge tone="warning">Closed to new patients</Badge> : null}
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1')}>
          View profile
        </Link>
        <Link
          href={`/patient/book?doctorId=${doctor.id}`}
          className={cn(buttonVariants({ size: 'sm' }), 'flex-1')}
          aria-label={`Book an appointment with ${doctor.name}`}
        >
          Book
        </Link>
      </div>
    </article>
  );
}
