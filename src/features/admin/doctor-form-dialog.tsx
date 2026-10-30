'use client';

import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { CheckboxRow, Field, FieldGroup } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { ServiceError, messageOf } from '@/lib/errors';
import { WEEKDAY_LABELS } from '@/lib/dates';
import { adminDoctorFormSchema, type AdminDoctorFormValues } from '@/lib/validations/admin';
import { doctorToAdminFormValues } from '@/services/doctor-mappers';
import { adminCreateDoctor, adminUpdateDoctor, listSpecialties } from '@/services/doctor-service';
import type { ConsultationMode } from '@/types/common';
import type { Doctor } from '@/types/doctor';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const MODES: ConsultationMode[] = ['in_person', 'video'];
const SLOT_LENGTHS = [30, 45, 60];

/** Create starts from an empty record; the number fields stay NaN so validation can catch them. */
const EMPTY_VALUES: AdminDoctorFormValues = {
  name: '',
  credentials: '',
  specialtyId: '',
  experienceYears: Number.NaN,
  accountEmail: '',
  about: '',
  highlight: '',
  languagesText: '',
  consultationFeeInr: Number.NaN,
  modes: [],
  acceptingNewPatients: true,
  clinicName: '',
  addressLine: '',
  city: '',
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '10:00',
  dayEnd: '17:00',
  slotMinutes: 30,
};

export interface DoctorFormDialogProps {
  mode: 'create' | 'edit';
  doctor?: Doctor;
  open: boolean;
  onClose: () => void;
  onSaved: (doctor: Doctor) => void;
}

/** One dialog for both admin paths: adding a record and editing an existing one. */
export function DoctorFormDialog({ mode, doctor, open, onClose, onSaved }: DoctorFormDialogProps) {
  const toast = useToast();
  const [requestError, setRequestError] = useState<string | null>(null);
  const specialtiesQuery = useAsyncQuery(listSpecialties, 'admin-doctor-specialties');

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminDoctorFormValues>({
    resolver: zodResolver(adminDoctorFormSchema),
    defaultValues: mode === 'edit' && doctor ? doctorToAdminFormValues(doctor) : EMPTY_VALUES,
  });

  const selectedWeekdays = useWatch({ control, name: 'weekdays' });
  const selectedModes = useWatch({ control, name: 'modes' });

  function toggleWeekday(day: number, checked: boolean) {
    const next = checked
      ? [...selectedWeekdays, day].sort((a, b) => a - b)
      : selectedWeekdays.filter((current) => current !== day);
    setValue('weekdays', next, { shouldValidate: true, shouldDirty: true });
  }

  function toggleMode(option: ConsultationMode, checked: boolean) {
    const next = checked ? [...selectedModes, option] : selectedModes.filter((current) => current !== option);
    setValue('modes', next, { shouldValidate: true, shouldDirty: true });
  }

  async function persist(values: AdminDoctorFormValues): Promise<Doctor> {
    if (mode === 'edit') {
      if (!doctor) {
        throw new ServiceError('not_found', 'That doctor record is no longer available. Close the dialog and try again.');
      }
      return adminUpdateDoctor(doctor.id, values);
    }
    return adminCreateDoctor(values);
  }

  async function onSubmit(values: AdminDoctorFormValues) {
    setRequestError(null);
    try {
      const saved = await persist(values);
      toast.success(
        mode === 'edit' ? 'Doctor record updated (demo)' : 'Doctor record created (demo)',
        `${saved.name} now holds these values in the local mock store. No login, message or credential check was performed.`,
      );
      onSaved(saved);
      onClose();
    } catch (error: unknown) {
      const message = messageOf(error, 'The mock service rejected the form.');
      setRequestError(message);
      toast.error('Could not save the doctor record', message);
    }
  }

  const submit = handleSubmit(onSubmit);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? `Edit ${doctor?.name ?? 'doctor record'}` : 'Add a doctor record'}
      description="Writes to the local mock store only: this demo creates no login, sends no message and verifies nothing."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={submit}>
            {mode === 'edit' ? 'Save changes' : 'Create record'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">
        <FormSection title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="admin-name" error={errors.name?.message}>
              <Input id="admin-name" invalid={Boolean(errors.name)} {...register('name')} />
            </Field>
            <Field label="Credentials" htmlFor="admin-credentials" hint="For example MBBS, MD, DM (Cardiology)." error={errors.credentials?.message}>
              <Input id="admin-credentials" invalid={Boolean(errors.credentials)} {...register('credentials')} />
            </Field>
            <Field label="Years of experience" htmlFor="admin-experience" error={errors.experienceYears?.message}>
              <Input
                id="admin-experience"
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                invalid={Boolean(errors.experienceYears)}
                {...register('experienceYears', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Account email"
              htmlFor="admin-account-email"
              hint="Stored on this record only. No login is provisioned and no email is sent in this demo."
              error={errors.accountEmail?.message}
            >
              <Input
                id="admin-account-email"
                type="email"
                invalid={Boolean(errors.accountEmail)}
                {...register('accountEmail')}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Specialty" htmlFor="admin-specialty" error={errors.specialtyId?.message}>
              <Select
                id="admin-specialty"
                invalid={Boolean(errors.specialtyId)}
                disabled={specialtiesQuery.isLoading}
                {...register('specialtyId')}
              >
                <option value="">
                  {specialtiesQuery.isLoading ? 'Loading specialties…' : 'Select a specialty'}
                </option>
                {(specialtiesQuery.data ?? []).map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </Select>
            </Field>
            {specialtiesQuery.error ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-rose-600">The specialty list did not load.</p>
                <Button variant="ghost" size="sm" onClick={specialtiesQuery.refetch}>
                  Retry
                </Button>
              </div>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Public profile">
          <Field label="Headline" htmlFor="admin-highlight" error={errors.highlight?.message}>
            <Input id="admin-highlight" invalid={Boolean(errors.highlight)} {...register('highlight')} />
          </Field>
          <Field label="About" htmlFor="admin-about" hint="Between 60 and 600 characters." error={errors.about?.message}>
            <Textarea
              id="admin-about"
              rows={4}
              invalid={Boolean(errors.about)}
              placeholder="How the clinic describes its practice."
              {...register('about')}
            />
          </Field>
          <Field
            label="Languages"
            htmlFor="admin-languages"
            hint="comma separated, up to 6."
            error={errors.languagesText?.message}
          >
            <Input id="admin-languages" invalid={Boolean(errors.languagesText)} {...register('languagesText')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Consultation fee (INR)" htmlFor="admin-fee" error={errors.consultationFeeInr?.message}>
              <Input
                id="admin-fee"
                type="number"
                inputMode="numeric"
                min={100}
                max={5000}
                invalid={Boolean(errors.consultationFeeInr)}
                {...register('consultationFeeInr', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Slot length" htmlFor="admin-slot-minutes" error={errors.slotMinutes?.message}>
              <Select
                id="admin-slot-minutes"
                invalid={Boolean(errors.slotMinutes)}
                {...register('slotMinutes', { valueAsNumber: true })}
              >
                {SLOT_LENGTHS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <FieldGroup
            legend="Consultation modes"
            error={errors.modes?.message}
            hint="Which visit types this doctor record accepts."
          >
            {MODES.map((modeOption) => (
              <CheckboxRow
                key={modeOption}
                id={`admin-mode-${modeOption}`}
                label={modeOption === 'in_person' ? 'In person' : 'Video call'}
                checked={selectedModes.includes(modeOption)}
                onChange={(event) => toggleMode(modeOption, event.target.checked)}
              />
            ))}
          </FieldGroup>

          <CheckboxRow
            id="admin-accepting"
            label="Accepting new patients"
            description="Controls whether this record appears as bookable in the demo directory."
            {...register('acceptingNewPatients')}
          />
        </FormSection>

        <FormSection title="Clinic">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clinic name" htmlFor="admin-clinic" error={errors.clinicName?.message}>
              <Input id="admin-clinic" invalid={Boolean(errors.clinicName)} {...register('clinicName')} />
            </Field>
            <Field label="City" htmlFor="admin-city" error={errors.city?.message}>
              <Input id="admin-city" invalid={Boolean(errors.city)} {...register('city')} />
            </Field>
          </div>
          <Field label="Address" htmlFor="admin-address" error={errors.addressLine?.message}>
            <Input id="admin-address" invalid={Boolean(errors.addressLine)} {...register('addressLine')} />
          </Field>
        </FormSection>

        <FormSection title="Weekly availability">
          <FieldGroup
            legend="Working days"
            error={errors.weekdays?.message}
            hint="The same opening window applies to every selected day."
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {WEEKDAYS.map((day) => (
                <CheckboxRow
                  key={day}
                  id={`admin-weekday-${day}`}
                  label={WEEKDAY_LABELS.short[day]}
                  checked={selectedWeekdays.includes(day)}
                  onChange={(event) => toggleWeekday(day, event.target.checked)}
                />
              ))}
            </div>
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opening time" htmlFor="admin-day-start" error={errors.dayStart?.message}>
              <Input id="admin-day-start" type="time" invalid={Boolean(errors.dayStart)} {...register('dayStart')} />
            </Field>
            <Field label="Closing time" htmlFor="admin-day-end" error={errors.dayEnd?.message}>
              <Input id="admin-day-end" type="time" invalid={Boolean(errors.dayEnd)} {...register('dayEnd')} />
            </Field>
          </div>
        </FormSection>

        {requestError ? <p className="text-sm text-rose-600">{requestError}</p> : null}

        <button type="submit" className="sr-only">
          Save doctor record
        </button>
      </form>
    </Dialog>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-ink-200 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}
