'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { MODE_LABEL } from '@/features/appointments/appointment-status';
import { useSession } from '@/features/auth/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckboxRow, Field, FieldGroup } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { WEEKDAY_LABELS } from '@/lib/dates';
import { messageOf } from '@/lib/errors';
import { specialtyNameOf } from '@/data/specialties';
import { doctorProfileSchema, type DoctorProfileValues } from '@/lib/validations/profile';
import { doctorToProfileFormValues } from '@/services/doctor-mappers';
import { getDoctor, updateDoctorProfile } from '@/services/doctor-service';
import type { Doctor } from '@/types/doctor';
import type { ConsultationMode } from '@/types/common';

const MODES: ConsultationMode[] = ['in_person', 'video'];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const SLOT_OPTIONS = [30, 45, 60] as const;

/** Read-only line describing the currently stored weekly window. */
function availabilitySummary(doctor: Doctor): string {
  const openDays = WEEKDAYS.filter((day) => doctor.availability[day] !== null);
  if (openDays.length === 0) return 'No clinic hours are set yet.';
  const first = doctor.availability[openDays[0]];
  const labels = openDays.map((day) => WEEKDAY_LABELS.short[day]).join(', ');
  return first ? `${labels} · ${first.start}–${first.end} · ${first.slotMinutes}-min slots` : labels;
}

export function DoctorProfileForm() {
  const { doctorId } = useSession();
  const toast = useToast();

  const query = useAsyncQuery(
    () => (doctorId ? getDoctor(doctorId) : Promise.resolve(null)),
    `doctor-profile:${doctorId ?? 'none'}`,
  );

  // The doctor layout already guarantees a doctor session; this only narrows the type.
  if (!doctorId) return null;

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <ErrorState title="Profile unavailable" message="The mock doctor record could not be loaded." onRetry={query.refetch} />
    );
  }

  return (
    <ProfileForm
      key={query.data.id}
      doctor={query.data}
      initial={doctorToProfileFormValues(query.data)}
      toast={toast}
      onSaved={query.refetch}
    />
  );
}

function ProfileForm({
  doctor,
  initial,
  toast,
  onSaved,
}: {
  doctor: Doctor;
  initial: DoctorProfileValues;
  toast: ReturnType<typeof useToast>;
  onSaved: () => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DoctorProfileValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: initial,
  });

  // RHF returns weekday checkbox groups as strings, so this set is driven manually
  // to keep the numbers zod expects.
  const selectedWeekdays = useWatch({ control, name: 'weekdays' });

  function toggleWeekday(day: number) {
    const next = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((value) => value !== day)
      : [...selectedWeekdays, day];
    setValue('weekdays', next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: DoctorProfileValues) {
    try {
      await updateDoctorProfile(doctor.id, values);
      toast.success('Clinic profile updated', 'Visible on your public doctor page in this demo.');
      onSaved();
    } catch (error: unknown) {
      toast.error('Could not save', messageOf(error, 'Please check the form and try again.'));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Identity"
          description="Administrators own your name, credentials, specialty and experience — edit them through the admin portal."
        />
        <CardContent className="space-y-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="font-medium text-ink-900">Name</dt>
              <dd className="text-ink-600">{doctor.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-ink-900">Credentials</dt>
              <dd className="text-ink-600">{doctor.credentials}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-ink-900">Specialty</dt>
              <dd className="text-ink-600">{specialtyNameOf(doctor.specialtyId)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-ink-900">Experience</dt>
              <dd className="text-ink-600">{doctor.experienceYears} years</dd>
            </div>
          </dl>
          <p className="rounded-field bg-ink-50 px-3 py-2 text-xs text-ink-600 ring-1 ring-inset ring-ink-200">
            Current hours: {availabilitySummary(doctor)}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Card>
          <CardHeader title="About your practice" description="Shown on your public doctor page." />
          <CardContent className="space-y-4">
            <Field
              label="Headline"
              htmlFor="highlight"
              hint="A short one-line summary, 10–120 characters."
              error={errors.highlight?.message}
            >
              <Input id="highlight" invalid={Boolean(errors.highlight)} {...register('highlight')} />
            </Field>

            <Field
              label="About"
              htmlFor="about"
              hint="Between 60 and 600 characters. Describe your focus and approach, not treatment advice."
              error={errors.about?.message}
            >
              <Textarea
                id="about"
                rows={5}
                invalid={Boolean(errors.about)}
                aria-describedby={errors.about ? 'about-error' : 'about-hint'}
                {...register('about')}
              />
            </Field>

            <Field
              label="Languages"
              htmlFor="languagesText"
              hint="Comma separated, up to 6."
              error={errors.languagesText?.message}
            >
              <Input id="languagesText" invalid={Boolean(errors.languagesText)} {...register('languagesText')} />
            </Field>

            <Field
              label="Consultation fee (₹)"
              htmlFor="consultationFeeInr"
              hint="Collected at the clinic in the demo. 100–5000."
              error={errors.consultationFeeInr?.message}
            >
              <Input
                id="consultationFeeInr"
                type="number"
                inputMode="numeric"
                invalid={Boolean(errors.consultationFeeInr)}
                {...register('consultationFeeInr', { valueAsNumber: true })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Consultation options" description="How patients can book with you." />
          <CardContent className="space-y-4">
            <FieldGroup legend="Modes" error={errors.modes?.message}>
              {MODES.map((mode) => (
                <CheckboxRow
                  key={mode}
                  id={`mode-${mode}`}
                  label={MODE_LABEL[mode]}
                  value={mode}
                  aria-invalid={Boolean(errors.modes) || undefined}
                  {...register('modes')}
                />
              ))}
            </FieldGroup>

            <FieldGroup legend="Availability" error={errors.acceptingNewPatients?.message}>
              <CheckboxRow
                id="acceptingNewPatients"
                label="Accepting new patients"
                description="Turning this off hides your booking option in the demo directory."
                {...register('acceptingNewPatients')}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Clinic location" description="Where in-person consultations happen." />
          <CardContent className="space-y-4">
            <Field label="Clinic name" htmlFor="clinicName" error={errors.clinicName?.message}>
              <Input id="clinicName" invalid={Boolean(errors.clinicName)} {...register('clinicName')} />
            </Field>
            <Field label="Address" htmlFor="addressLine" error={errors.addressLine?.message}>
              <Input id="addressLine" invalid={Boolean(errors.addressLine)} {...register('addressLine')} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" invalid={Boolean(errors.city)} {...register('city')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Working days and hours"
            description="Changing these days changes which slots patients can book."
          />
          <CardContent className="space-y-4">
            <FieldGroup legend="Working days" error={errors.weekdays?.message}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKDAYS.map((day) => (
                  <CheckboxRow
                    key={day}
                    id={`weekday-${day}`}
                    label={WEEKDAY_LABELS.short[day]}
                    checked={selectedWeekdays.includes(day)}
                    aria-invalid={Boolean(errors.weekdays) || undefined}
                    onChange={() => toggleWeekday(day)}
                  />
                ))}
              </div>
            </FieldGroup>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Opens at" htmlFor="dayStart" error={errors.dayStart?.message}>
                <Input id="dayStart" type="time" invalid={Boolean(errors.dayStart)} {...register('dayStart')} />
              </Field>
              <Field label="Closes at" htmlFor="dayEnd" error={errors.dayEnd?.message}>
                <Input id="dayEnd" type="time" invalid={Boolean(errors.dayEnd)} {...register('dayEnd')} />
              </Field>
              <Field label="Slot length" htmlFor="slotMinutes" error={errors.slotMinutes?.message}>
                <Select id="slotMinutes" invalid={Boolean(errors.slotMinutes)} {...register('slotMinutes', { valueAsNumber: true })}>
                  {SLOT_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            Save profile
          </Button>
          <Button type="button" variant="outline" onClick={() => reset(initial)} disabled={isSubmitting}>
            Discard changes
          </Button>
          <p className="text-xs text-ink-500">Saving writes to the mock store in this browser only.</p>
        </div>
      </form>
    </div>
  );
}
