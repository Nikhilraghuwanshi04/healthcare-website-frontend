'use client';

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { messageOf } from '@/lib/errors';

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 sm:px-6">
      <ErrorState
        title="This page could not be loaded"
        message={messageOf(error, 'An unexpected error interrupted rendering.')}
        onRetry={retry}
      />
      <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Back to home
      </Link>
    </div>
  );
}
