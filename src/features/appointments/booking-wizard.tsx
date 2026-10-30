'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { bookingDetailsFromProfile, clearBookingDraft, EMPTY_DRAFT, EMPTY_DETAILS, EMPTY_SELECTION, readBookingDraft, STEP_LABEL, STEP_ORDER, writeBookingDraft, type BookingDraft, type BookingStep } from './booking-model';
import { ConfirmationStep } from './confirmation-step';
import { DetailsStep } from './details-step';
import { DoctorStep } from './doctor-step';
import { ReviewStep } from './review-step';
import { SlotStep } from './slot-step';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { useHydrated } from '@/hooks/use-hydrated';
import { useSession } from '@/features/auth/session-provider';
import { isServiceError, messageOf } from '@/lib/errors';
import { createAppointment } from '@/services/appointment-service';
import { getDoctor } from '@/services/doctor-service';
import { getPatient } from '@/services/patient-service';
import { listDoctorSlots } from '@/services/slot-service';
import type { BookingDetailsValues } from '@/lib/validations/booking';
import type { Appointment } from '@/types/appointment';
import type { ConsultationMode } from '@/types/common';

function StepTracker({ step }: { step: BookingStep }) {
  const currentIndex = step === 'confirmation' ? STEP_ORDER.length : STEP_ORDER.indexOf(step);

  return (
    <ol aria-label="Booking progress" className="flex flex-wrap items-center gap-2">
      {STEP_ORDER.map((item, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li
            key={item}
            aria-current={state === 'current' ? 'step' : undefined}
            className={
              state === 'current'
                ? 'rounded-field bg-brand-600 px-3 py-1.5 text-sm font-medium text-white'
                : state === 'done'
                  ? 'rounded-field bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-inset ring-brand-200'
                  : 'rounded-field border border-ink-200 px-3 py-1.5 text-sm text-ink-500'
            }
          >
            <span className="mr-1.5 text-xs">{index + 1}</span>
            {STEP_LABEL[item]}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The booking wizard: doctor → slot → details → review → confirmation.
 * Draft state lives in localStorage through `booking-model`, so a reload does
 * not lose progress, and every mutation goes through the typed service layer.
 */
export function BookingWizard() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const { patientId } = useSession();
  const toast = useToast();

  const [draft, setDraft] = useState<BookingDraft>(() => {
    const stored = readBookingDraft();
    const requested = searchParams.get('doctorId');
    if (requested && requested !== stored?.selection.doctorId) {
      return { step: 'slot', selection: { ...EMPTY_SELECTION, doctorId: requested }, details: stored?.details ?? null };
    }
    if (!stored) return EMPTY_DRAFT;
    return {
      step: STEP_ORDER.includes(stored.step) ? stored.step : 'doctor',
      selection: stored.selection,
      details: stored.details,
    };
  });
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formProblem, setFormProblem] = useState<string | null>(null);

  const doctorQuery = useAsyncQuery(
    () => (draft.selection.doctorId ? getDoctor(draft.selection.doctorId) : Promise.resolve(null)),
    `book-doctor:${draft.selection.doctorId}`,
  );
  const slotsQuery = useAsyncQuery(
    () => (draft.selection.doctorId ? listDoctorSlots(draft.selection.doctorId) : Promise.resolve([])),
    `book-slots:${draft.selection.doctorId}`,
  );
  const profileQuery = useAsyncQuery(
    () => (patientId ? getPatient(patientId) : Promise.resolve(null)),
    `book-profile:${patientId ?? 'none'}`,
  );

  const doctor = doctorQuery.data;
  const slots = slotsQuery.data ?? [];
  const selectedSlot = slots.find((slot) => slot.id === draft.selection.slotId) ?? null;
  const offeredModes = doctor?.modes ?? [];
  const mode: ConsultationMode = offeredModes.includes(draft.selection.mode)
    ? draft.selection.mode
    : (offeredModes[0] ?? 'in_person');
  const details: BookingDetailsValues = draft.details ?? (profileQuery.data ? bookingDetailsFromProfile(profileQuery.data) : EMPTY_DETAILS);

  function update(next: Partial<BookingDraft>) {
    const merged: BookingDraft = { ...draft, ...next };
    setDraft(merged);
    writeBookingDraft(merged);
  }

  function startOver() {
    clearBookingDraft();
    setBooked(null);
    setFormProblem(null);
    setDraft(EMPTY_DRAFT);
  }

  async function confirm() {
    if (!patientId || !doctor || !selectedSlot) return;
    setSubmitting(true);
    setFormProblem(null);
    try {
      const appointment = await createAppointment({
        doctorId: doctor.id,
        slotId: selectedSlot.id,
        patientId,
        patient: {
          fullName: details.fullName,
          email: details.email,
          phone: details.phone,
          dateOfBirth: details.dateOfBirth,
          gender: details.gender,
        },
        reason: details.reason,
        mode,
      });
      clearBookingDraft();
      setBooked(appointment);
      setDraft({ ...draft, step: 'confirmation', selection: EMPTY_SELECTION, details: null });
      toast.success('Slot held in the demo store', `${appointment.reference} is pending — nothing was sent to the clinic.`);
    } catch (error: unknown) {
      const text = messageOf(error, 'The booking could not be completed.');
      setFormProblem(text);
      toast.error('Booking failed', text);
      if (isServiceError(error) && error.code === 'slot_unavailable') {
        update({ step: 'slot', selection: { ...draft.selection, slotId: '' } });
        slotsQuery.refetch();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (draft.step === 'confirmation' && booked) {
    return (
      <div className="space-y-6">
        <StepTracker step="confirmation" />
        <ConfirmationStep appointment={booked} onBookAnother={startOver} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepTracker step={draft.step} />

      {doctorQuery.error ? (
        <ErrorState
          title="This doctor is unavailable"
          message="The profile could not be loaded from the mock service."
          onRetry={doctorQuery.refetch}
        />
      ) : (
        <div className="space-y-5">
          {draft.step === 'doctor' ? (
            <DoctorStep
              selectedDoctorId={draft.selection.doctorId || null}
              onSelect={(doctorId) => update({ selection: { ...EMPTY_SELECTION, doctorId } })}
              onContinue={() => update({ step: 'slot' })}
            />
          ) : null}

          {draft.step === 'slot' ? (
            <>
              <SlotStep
                doctor={doctor}
                loadingDoctor={doctorQuery.isLoading}
                slots={slots}
                loadingSlots={slotsQuery.isLoading}
                slotId={draft.selection.slotId}
                mode={mode}
                problem={formProblem}
                onSelectSlot={(slot) => {
                  setFormProblem(null);
                  update({ selection: { ...draft.selection, slotId: slot.id } });
                }}
                onSelectMode={(picked) => update({ selection: { ...draft.selection, mode: picked } })}
                onChangeDoctor={() => update({ step: 'doctor' })}
              />
              <WizardNav
                nextLabel="Continue to details"
                nextDisabled={selectedSlot === null}
                hint={
                  selectedSlot
                    ? null
                    : 'Pick one open time above. Booked and past-the-lead-time times are disabled.'
                }
                onNext={() => {
                  setFormProblem(null);
                  update({ step: 'details' });
                }}
              />
            </>
          ) : null}

          {draft.step === 'details' ? (
            <>
              <DetailsStep
                initial={details}
                prefilling={profileQuery.isLoading && draft.details === null}
                onSubmit={(values) => {
                  setFormProblem(null);
                  update({ details: values, step: 'review' });
                }}
              />
              <div className="flex justify-start">
                <Button variant="ghost" onClick={() => update({ step: 'slot' })}>
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                  Back to times
                </Button>
              </div>
            </>
          ) : null}

          {draft.step === 'review' ? (
            doctor && selectedSlot ? (
              <ReviewStep
                doctor={doctor}
                slot={selectedSlot}
                mode={mode}
                details={details}
                submitting={submitting}
                errorMessage={formProblem}
                onBack={() => update({ step: 'details' })}
                onConfirm={confirm}
              />
            ) : (
              <Card>
                <CardContent className="space-y-3">
                  <p className="text-sm text-ink-600">
                    The chosen time is no longer listed, so there is nothing to review yet.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" onClick={() => update({ step: 'slot' })}>
                      Pick another time
                    </Button>
                    <Link
                      href="/patient/appointments"
                      className="rounded-field border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
                    >
                      View my appointments
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      )}

      {draft.step !== 'doctor' ? (
        <p className="text-xs text-ink-500">
          Progress is saved in this browser only. <button type="button" onClick={startOver} className="font-medium text-brand-700 hover:underline">Start over</button>.
        </p>
      ) : null}
    </div>
  );
}

function WizardNav({
  nextLabel,
  onNext,
  nextDisabled,
  hint,
}: {
  nextLabel: string;
  onNext: () => void;
  nextDisabled: boolean;
  hint: string | null;
}) {
  return (
    <div className="space-y-2">
      {hint ? <p className="text-sm text-ink-500">{hint}</p> : null}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Button>
    </div>
  );
}
