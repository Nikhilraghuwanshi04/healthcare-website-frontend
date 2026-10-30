import type { Metadata } from 'next';

import { AuthScreen } from '@/components/layout/auth-screen';
import { SignUpForm } from '@/features/auth/sign-up-form';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Register a patient account in the Medibook demo.',
};

export default function SignUpPage() {
  return (
    <AuthScreen
      title="Create a patient account"
      description="Registration writes a patient record to this browser's storage so the booking flow has something to attach appointments to. It is not real authentication, and no email verification runs."
    >
      <SignUpForm />
    </AuthScreen>
  );
}
