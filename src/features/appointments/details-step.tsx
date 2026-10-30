'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { GENDER_LABEL, GENDER_OPTIONS } from '@/lib/labels';
import { bookingDetailsSchema, type BookingDetailsValues } from '@/lib/validations/booking';

/** Step 3: who the appointment is for and why. Prefilled from the signed-in profile. */
export function DetailsStep({
  initial,
  prefilling,
  onSubmit,
}: {
  initial: BookingDetailsValues;
  prefilling: boolean;
  onSubmit: (values: BookingDetailsValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingDetailsValues>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: initial,
    values: initial,
  });

  return (
    <Card>
      <CardHeader
        title="Patient details"
        description={
          prefilling
            ? 'Loading the details saved on your profile…'
            : 'Pre-filled from your profile. Edit them if this appointment is for someone else.'
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Full name" htmlFor="booking-fullName" error={errors.fullName?.message}>
            <Input
              id="booking-fullName"
              disabled={prefilling}
              invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'booking-fullName-error' : undefined}
              {...register('fullName')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="booking-email" error={errors.email?.message}>
              <Input
                id="booking-email"
                type="email"
                disabled={prefilling}
                invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'booking-email-error' : undefined}
                {...register('email')}
              />
            </Field>

            <Field label="Mobile number" htmlFor="booking-phone" error={errors.phone?.message}>
              <Input
                id="booking-phone"
                type="tel"
                inputMode="numeric"
                disabled={prefilling}
                invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'booking-phone-error' : undefined}
                {...register('phone')}
              />
            </Field>

            <Field label="Date of birth" htmlFor="booking-dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input
                id="booking-dateOfBirth"
                type="date"
                disabled={prefilling}
                invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={errors.dateOfBirth ? 'booking-dateOfBirth-error' : undefined}
                {...register('dateOfBirth')}
              />
            </Field>

            <Field label="Gender" htmlFor="booking-gender" error={errors.gender?.message}>
              <Select
                id="booking-gender"
                disabled={prefilling}
                invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? 'booking-gender-error' : undefined}
                {...register('gender')}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {GENDER_LABEL[option]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Reason for the visit"
            htmlFor="booking-reason"
            hint="Symptoms or purpose, in 10–300 characters. Do not share reports or images here."
            error={errors.reason?.message}
          >
            <Textarea
              id="booking-reason"
              rows={4}
              disabled={prefilling}
              invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? 'booking-reason-error' : 'booking-reason-hint'}
              {...register('reason')}
            />
          </Field>

          <Button type="submit" disabled={prefilling}>
            Review booking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
