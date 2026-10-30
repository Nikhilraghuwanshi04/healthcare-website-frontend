'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cancelAppointment } from '@/services/appointment-service';
import { messageOf } from '@/lib/errors';
import { formatDateTime } from '@/lib/dates';
import type { Appointment, CancellationActor } from '@/types/appointment';

const REASONS = [
  'Schedule conflict',
  'Feeling better already',
  'Travelling that day',
  'Booked the wrong specialty',
  'Cost',
  'Other',
] as const;

const schema = z.object({
  reasonCategory: z.enum(REASONS, { error: 'Choose why you are cancelling' }),
  reasonNote: z.string().trim().max(120, 'Keep the note under 120 characters'),
});

type CancelFormValues = z.infer<typeof schema>;

export function CancelAppointmentDialog({
  appointment,
  actor,
  open,
  onClose,
  onCancelled,
}: {
  appointment: Appointment;
  actor: CancellationActor;
  open: boolean;
  onClose: () => void;
  onCancelled: (cancelled: Appointment) => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reasonCategory: undefined, reasonNote: '' },
  });

  function onSubmit(values: CancelFormValues) {
    setSubmitting(true);
    const reason = values.reasonNote ? `${values.reasonCategory}: ${values.reasonNote}` : values.reasonCategory;

    cancelAppointment({ appointmentId: appointment.id, reason, actor })
      .then((cancelled) => {
        toast.success('Appointment cancelled', `${cancelled.reference} is no longer held.`);
        onCancelled(cancelled);
        onClose();
      })
      .catch((error: unknown) => {
        toast.error('Could not cancel', messageOf(error, 'Please try again.'));
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel this appointment?"
      description={`${appointment.doctorName} · ${formatDateTime(appointment.startAt)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Keep appointment
          </Button>
          <Button variant="danger" loading={submitting} onClick={handleSubmit(onSubmit)}>
            Cancel appointment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-ink-600">
          This frees the time slot for other patients in the demo store. No message is sent to the clinic because this
          build has no backend.
        </p>
        <Field label="Reason" htmlFor="reason-category" error={errors.reasonCategory?.message}>
          <Select id="reason-category" {...register('reasonCategory')} defaultValue="">
            <option value="" disabled>
              Select a reason
            </option>
            {REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Anything else?"
          htmlFor="reason-note"
          hint="Optional. Shown to the clinic in the demo queue."
          error={errors.reasonNote?.message}
        >
          <Input id="reason-note" placeholder="Add a short note" {...register('reasonNote')} />
        </Field>
        <button type="submit" className="sr-only">
          Submit cancellation
        </button>
      </form>
    </Dialog>
  );
}
