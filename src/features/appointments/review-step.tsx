'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckboxRow } from '@/components/ui/field';
import { MODE_LABEL } from './appointment-status';
import { specialtyNameOf } from '@/data/specialties';
import { formatDateTime } from '@/lib/dates';
import { formatINR } from '@/lib/utils';
import { bookingConsentSchema, type BookingConsentValues, type BookingDetailsValues } from '@/lib/validations/booking';
import type { ConsultationMode } from '@/types/common';
import type { AppointmentSlot, Doctor } from '@/types/doctor';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

/** Step 4: everything the patient entered, checked before the demo booking is written. */
export function ReviewStep({
  doctor,
  slot,
  mode,
  details,
  submitting,
  errorMessage,
  onBack,
  onConfirm,
}: {
  doctor: Doctor;
  slot: AppointmentSlot;
  mode: ConsultationMode;
  details: BookingDetailsValues;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingConsentValues>({
    resolver: zodResolver(bookingConsentSchema),
    defaultValues: { confirmAccurate: false },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Review and confirm" description="Nothing has been booked yet." />
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Appointment</h3>
            <dl className="divide-y divide-ink-200">
              <SummaryRow label="Doctor" value={`${doctor.name} · ${specialtyNameOf(doctor.specialtyId)}`} />
              <SummaryRow label="Date and time" value={formatDateTime(slot.startAt)} />
              <SummaryRow label="Duration" value={`${slot.durationMinutes} minutes`} />
              <SummaryRow label="Mode" value={MODE_LABEL[mode]} />
              <SummaryRow label="Consultation fee" value={`${formatINR(doctor.consultationFeeInr)} (pay at clinic)`} />
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900">Patient</h3>
            <dl className="divide-y divide-ink-200">
              <SummaryRow label="Name" value={details.fullName} />
              <SummaryRow label="Email" value={details.email} />
              <SummaryRow label="Mobile" value={details.phone} />
              <SummaryRow label="Date of birth" value={details.dateOfBirth} />
              <SummaryRow label="Reason" value={details.reason} />
            </dl>
          </div>

          <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
            MOCK BOOKING: confirming writes a record into this browser only. No appointment, payment, email or SMS is
            created or sent anywhere.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onConfirm)} className="space-y-4" noValidate>
            <CheckboxRow
              id="confirm-accurate"
              label="The details above are accurate"
              description="A wrong date of birth or phone number delays care, so please check them."
              disabled={submitting}
              aria-invalid={Boolean(errors.confirmAccurate) || undefined}
              {...register('confirmAccurate')}
            />
            {errors.confirmAccurate ? (
              <p className="text-sm text-rose-600">{errors.confirmAccurate.message}</p>
            ) : null}
            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={submitting}>
                {submitting ? 'Booking…' : 'Confirm booking'}
              </Button>
              <Button type="button" variant="ghost" disabled={submitting} onClick={onBack}>
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Go back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
