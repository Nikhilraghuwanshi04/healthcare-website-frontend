'use client';

import type { ReactNode } from 'react';

import { AppShell } from './app-shell';
import { AccessPrompt } from '@/features/auth/access-prompt';
import { useSession } from '@/features/auth/session-provider';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/types/common';

/**
 * One guard + shell for every role area, so no page repeats session checks or
 * navigation markup. Route groups ((patient), (doctor), (admin)) each render it.
 */
export function PortalLayout({ role, children }: { role: UserRole; children: ReactNode }) {
  const { status, session } = useSession();

  if (status === 'loading') {
    return (
      <div className="page-container space-y-6 py-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`portal-skeleton-${index}`} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) return <AccessPrompt role={role} />;
  if (session.role !== role) return <AccessPrompt role={role} signedInAs={session} />;

  return <AppShell role={role}>{children}</AppShell>;
}
