'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, CalendarClock, GraduationCap, MapPin, MessageSquare, Star } from 'lucide-react';

import { SlotPicker } from '@/features/appointments/slot-picker';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/states';
import { MODE_LABEL } from '@/features/appointments/appointment-status';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatClock, WEEKDAY_LABELS } from '@/lib/dates';
import { cn, formatINR } from '@/lib/utils';
import { specialtyNameOf } from '@/data/specialties';
import { getDoctor } from '@/services/doctor-service';
import { listDoctorSlots } from '@/services/slot-service';
import type { AppointmentSlot } from '@/types/doctor';

const PROFILE_WINDOW_DAYS = 7;

export function DoctorProfileView({ doctorId }: { doctorId: string }) {
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);

  const doctorQuery = useAsyncQuery(() => getDoctor(doctorId), doctorId);
  const slotsQuery = useAsyncQuery(() => listDoctorSlots(doctorId, { days: PROFILE_WINDOW_DAYS }), `${doctorId}-slots`);

  if (doctorQuery.error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Doctor not found"
          message="This profile is not in the mock catalogue any more. The link may be stale."
        />
        <Link href="/doctors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}>
          Back to the directory
        </Link>
      </div>
    );
  }

  const doctor = doctorQuery.data;

  if (!doctor) {
    return (
      <div className="page-container space-y-6 py-10">
        <div className="flex gap-5">
          <div className="h-20 w-20 animate-pulse rounded-full bg-ink-200/70" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-56 animate-pulse rounded bg-ink-200/70" />
            <div className="h-4 w-72 animate-pulse rounded bg-ink-200/70" />
          </div>
        </div>
        <div className="h-40 animate-pulse rounded-card bg-ink-200/70" />
      </div>
    );
  }

  const openDays = Object.entries(doctor.availability).filter(([, window]) => window !== null);

  return (
    <div className="page-container space-y-8 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={doctor.name} seed={doctor.id} size="xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{doctor.name}</h1>
                  <p className="text-sm text-ink-600">{doctor.credentials}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone="brand">{specialtyNameOf(doctor.specialtyId)}</Badge>
                    <span className="inline-flex items-center gap-1 text-ink-600">
                      <Star aria-hidden className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <strong className="font-semibold text-ink-900">{doctor.rating.toFixed(1)}</strong>
                      <span className="text-ink-500">({doctor.reviewCount} demo reviews)</span>
                    </span>
                    <span className="text-ink-500">{doctor.experienceYears} years experience</span>
                    {doctor.profileVerifiedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <BadgeCheck aria-hidden className="h-4 w-4" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink-700">{doctor.highlight}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-ink-200 pt-4">
                <h2 className="text-sm font-semibold text-ink-900">About</h2>
                <p className="text-sm leading-relaxed text-ink-600">{doctor.about}</p>
              </div>

              <dl className="grid gap-4 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="flex items-center gap-2 font-medium text-ink-900">
                    <GraduationCap aria-hidden className="h-4 w-4 text-ink-400" />
                    Education
                  </dt>
                  <dd className="space-y-1 text-ink-600">
                    {doctor.education.map((entry) => (
                      <p key={entry}>{entry}</p>
                    ))}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="flex items-center gap-2 font-medium text-ink-900">
                    <MessageSquare aria-hidden className="h-4 w-4 text-ink-400" />
                    Speaks
                  </dt>
                  <dd className="text-ink-600">{doctor.languages.join(', ')}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="flex items-center gap-2 font-medium text-ink-900">
                    <MapPin aria-hidden className="h-4 w-4 text-ink-400" />
                    Clinic
                  </dt>
                  <dd className="text-ink-600">
                    {doctor.location.clinicName}
                    <span className="block">{doctor.location.addressLine}</span>
                    <span className="block">{doctor.location.city}</span>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="flex items-center gap-2 font-medium text-ink-900">
                    <CalendarClock aria-hidden className="h-4 w-4 text-ink-400" />
                    Regular hours
                  </dt>
                  <dd className="space-y-1 text-ink-600">
                    {openDays.length === 0 ? (
                      <p>No clinic hours set.</p>
                    ) : (
                      openDays.map(([day, window]) => (
                        <p key={day}>
                          {WEEKDAY_LABELS.full[Number(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6]} · {window?.start} – {window?.end} ·{' '}
                          {window?.slotMinutes} min slots
                        </p>
                      ))
                    )}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                {doctor.modes.map((mode) => (
                  <Badge key={mode} tone="neutral">
                    {MODE_LABEL[mode]}
                  </Badge>
                ))}
                <Badge tone="info">{formatINR(doctor.consultationFeeInr)} per visit</Badge>
                {!doctor.acceptingNewPatients ? <Badge tone="warning">Closed to new patients</Badge> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Next 7 days" description="Live from the mock slot service, including booked times." />
            <CardContent className="space-y-4">
              <SlotPicker
                slots={slotsQuery.data ?? []}
                loading={slotsQuery.isLoading}
                selectedSlotId={selectedSlot?.id ?? null}
                onSelect={setSelectedSlot}
              />
              {slotsQuery.error ? (
                <ErrorState title="Slots unavailable" message="The mock slot service did not respond." onRetry={slotsQuery.refetch} />
              ) : null}

              {selectedSlot ? (
                <p className="rounded-field bg-brand-50 px-3 py-2 text-sm text-brand-900 ring-1 ring-inset ring-brand-200">
                  Selected {formatClock(new Date(selectedSlot.startAt))} · {specialtyNameOf(doctor.specialtyId)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Book with this doctor" description="The booking flow takes about a minute." />
            <CardContent className="space-y-3">
              <Link
                href={
                  selectedSlot
                    ? `/patient/book?doctorId=${doctor.id}&slotId=${selectedSlot.id}`
                    : `/patient/book?doctorId=${doctor.id}`
                }
                className={cn(buttonVariants(), 'w-full')}
              >
                {selectedSlot ? 'Continue to booking' : 'Choose a slot in booking'}
              </Link>
              <p className="text-xs text-ink-500">
                Booking is mocked in the browser: nothing is sent to the clinic, and no reminder or payment happens.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
