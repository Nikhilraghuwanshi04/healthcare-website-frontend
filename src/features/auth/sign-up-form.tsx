'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/features/auth/session-provider';
import { GENDER_LABEL, GENDER_OPTIONS } from '@/lib/labels';
import { messageOf } from '@/lib/errors';
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth';

export function SignUpForm() {
  const { signUp } = useSession();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignUpValues) {
    try {
      const session = await signUp(values);
      toast.success('Account created (demo)', `${session.displayName} can now book appointments.`);
      router.push('/patient/dashboard');
    } catch (error: unknown) {
      setError('email', { message: messageOf(error, 'Sign-up failed.') });
      toast.error('Could not create the account', 'Check the details and try again.');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Create a patient account"
        description="Mock registration: the record is written to this browser only, and no verification email is sent."
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              {...register('fullName')}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <Field label="Mobile number" htmlFor="phone" hint="10 digits, used by the clinic to reach you" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              {...register('phone')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
                {...register('dateOfBirth')}
              />
            </Field>

            <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <Select
                id="gender"
                invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? 'gender-error' : undefined}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" htmlFor="password" hint="At least 8 characters" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                {...register('password')}
              />
            </Field>

            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                {...register('confirmPassword')}
              />
            </Field>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            <UserPlus aria-hidden className="h-4 w-4" />
            Create account (demo)
          </Button>

          <p className="text-center text-sm text-ink-600">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
