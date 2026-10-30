'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useSession } from '@/features/auth/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { GENDER_LABEL, GENDER_OPTIONS } from '@/lib/labels';
import { messageOf } from '@/lib/errors';
import { BLOOD_GROUPS } from '@/types/common';
import { patientProfileSchema, type PatientProfileValues } from '@/lib/validations/profile';
import { getPatient, toPatientProfileFormValues, updatePatientProfile } from '@/services/patient-service';

const BLOOD_GROUP_LABEL: Record<string, string> = {
  ...Object.fromEntries(BLOOD_GROUPS.map((group) => [group, group])),
  unknown: 'Not known / prefer not to say',
};

export function PatientProfileForm() {
  const { patientId, rename } = useSession();
  const toast = useToast();

  const query = useAsyncQuery(
    () => (patientId ? getPatient(patientId) : Promise.resolve(null)),
    `profile:${patientId ?? 'none'}`,
  );

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (query.error || !query.data || !patientId) {
    return (
      <ErrorState
        title="Profile unavailable"
        message="The mock patient record could not be loaded."
        onRetry={query.refetch}
      />
    );
  }

  return (
    <ProfileForm
      key={query.data.id}
      patientId={patientId}
      initial={toPatientProfileFormValues(query.data)}
      onSaved={(fullName) => {
        rename(fullName);
        query.refetch();
      }}
      toast={toast}
    />
  );
}

function ProfileForm({
  patientId,
  initial,
  onSaved,
  toast,
}: {
  patientId: string;
  initial: PatientProfileValues;
  onSaved: (fullName: string) => void;
  toast: ReturnType<typeof useToast>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientProfileValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: PatientProfileValues) {
    try {
      const updated = await updatePatientProfile(patientId, values);
      toast.success('Profile saved', 'Stored in this browser only — no server was contacted.');
      onSaved(updated.fullName);
    } catch (error: unknown) {
      toast.error('Could not save', messageOf(error, 'Please check the form and try again.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Card>
        <CardHeader title="Personal details" description="Used to identify you at the clinic." />
        <CardContent className="space-y-4">
          <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" invalid={Boolean(errors.fullName)} {...register('fullName')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" invalid={Boolean(errors.email)} {...register('email')} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" inputMode="numeric" invalid={Boolean(errors.phone)} {...register('phone')} />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" invalid={Boolean(errors.dateOfBirth)} {...register('dateOfBirth')} />
            </Field>
            <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <Select id="gender" invalid={Boolean(errors.gender)} {...register('gender')}>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {GENDER_LABEL[option]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Blood group" htmlFor="bloodGroup" error={errors.bloodGroup?.message} optional>
              <Select id="bloodGroup" {...register('bloodGroup')}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {BLOOD_GROUP_LABEL[group]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Address" description="Where follow-up documents would be sent." />
        <CardContent className="space-y-4">
          <Field label="Street address" htmlFor="addressLine1" error={errors.addressLine1?.message}>
            <Input id="addressLine1" invalid={Boolean(errors.addressLine1)} {...register('addressLine1')} />
          </Field>
          <Field
            label="Flat or building (optional)"
            htmlFor="addressLine2"
            error={errors.addressLine2?.message}
            optional
          >
            <Input id="addressLine2" {...register('addressLine2')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" invalid={Boolean(errors.city)} {...register('city')} />
            </Field>
            <Field label="State" htmlFor="state" error={errors.state?.message}>
              <Input id="state" invalid={Boolean(errors.state)} {...register('state')} />
            </Field>
            <Field label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message}>
              <Input id="postalCode" inputMode="numeric" invalid={Boolean(errors.postalCode)} {...register('postalCode')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Emergency contact"
          description="Optional, but fill all three fields if you fill any of them."
        />
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" htmlFor="emergencyName" error={errors.emergencyName?.message} optional>
              <Input id="emergencyName" invalid={Boolean(errors.emergencyName)} {...register('emergencyName')} />
            </Field>
            <Field label="Mobile" htmlFor="emergencyPhone" error={errors.emergencyPhone?.message} optional>
              <Input id="emergencyPhone" type="tel" inputMode="numeric" invalid={Boolean(errors.emergencyPhone)} {...register('emergencyPhone')} />
            </Field>
            <Field label="Relation" htmlFor="emergencyRelation" error={errors.emergencyRelation?.message} optional>
              <Input id="emergencyRelation" {...register('emergencyRelation')} />
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
      </div>
    </form>
  );
}
