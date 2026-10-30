import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthScreen } from '@/components/layout/auth-screen';
import { SignInForm } from '@/features/auth/sign-in-form';
import { Skeleton } from '@/components/ui/skeleton';
import { DEMO_ACCOUNT_HINTS } from '@/services/auth-service';
import { MOCK_PASSWORD } from '@/data/accounts';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the Medibook demo with a mock account.',
};

/** searchParams must be read inside a Suspense boundary when cacheComponents is on. */
async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return (
    <SignInForm
      next={typeof next === 'string' ? next : null}
      hints={DEMO_ACCOUNT_HINTS}
      demoPassword={MOCK_PASSWORD}
    />
  );
}

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <AuthScreen
      title="Sign in to Medibook"
      description="Sign-in is mocked in the browser: the email and password are matched against demo fixtures, nothing is sent to a server, and no session cookie is issued."
    >
      <Suspense fallback={<Skeleton className="h-[520px] rounded-card" />}>
        <SignIn searchParams={props.searchParams} />
      </Suspense>
    </AuthScreen>
  );
}
