'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import { ROLE_HOME, ROLE_LABEL } from '@/components/layout/nav-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/features/auth/session-provider';
import { messageOf } from '@/lib/errors';
import { signInSchema, type SignInValues } from '@/lib/validations/auth';
import type { MockSession } from '@/types/user';
import type { UserRole } from '@/types/common';

export interface DemoHint {
  role: UserRole;
  email: string;
  displayName: string;
}

/** Only internal paths are allowed, so ?next= can never be an open redirect. */
function safeNext(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export function SignInForm({ next, hints, demoPassword }: { next: string | null; hints: DemoHint[]; demoPassword: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { signIn } = useSession();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  function goAfterSignIn(session: MockSession) {
    router.push(safeNext(next) ?? ROLE_HOME[session.role]);
  }

  async function onSubmit(values: SignInValues) {
    try {
      const session = await signIn(values);
      toast.success('Signed in (demo)', `${session.displayName} — no real authentication happened.`);
      goAfterSignIn(session);
    } catch (error: unknown) {
      setError('email', { message: messageOf(error, 'Sign in failed.') });
      toast.error('Mock sign-in failed', 'Check the demo email and password below.');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Sign in to the demo"
        description="Mock authentication: credentials are checked in your browser against seeded fixtures."
      />
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-11"
                invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 px-3 text-ink-500 hover:text-ink-700"
              >
                {passwordVisible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Button type="submit" loading={isSubmitting} className="w-full">
            <LogIn aria-hidden className="h-4 w-4" />
            Sign in (demo)
          </Button>

          <p className="text-center text-sm text-ink-600">
            No account?{' '}
            <Link href="/signup" className="font-medium text-brand-700 hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <div className="rounded-field border border-ink-200 bg-ink-50 p-4">
          <p className="text-sm font-medium text-ink-900">Demo accounts</p>
          <p className="mt-1 text-xs text-ink-600">
            Password for all of them: <code className="rounded bg-white px-1 py-0.5 font-mono text-ink-800">{demoPassword}</code>
          </p>
          <ul className="mt-3 space-y-2">
            {hints.map((hint) => (
              <li key={hint.email} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-ink-800">{hint.displayName}</span>
                  <button
                    type="button"
                    onClick={() => setValue('email', hint.email)}
                    className="truncate text-xs text-brand-700 hover:underline"
                  >
                    {hint.email}
                  </button>
                </span>
                <span className="shrink-0 text-xs text-ink-500">{ROLE_LABEL[hint.role]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
