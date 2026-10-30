'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { ROLE_HOME, ROLE_LABEL } from '@/components/layout/nav-config';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/common';

const DEMO_EMAIL: Record<UserRole, string> = {
  patient: 'patient@demo.medibook.local',
  doctor: 'doctor@demo.medibook.local',
  admin: 'admin@demo.medibook.local',
};

export function AccessPrompt({
  role,
  signedInAs,
}: {
  role: UserRole;
  signedInAs?: { displayName: string; role: UserRole };
}) {
  return (
    <div className="mx-auto flex max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <ShieldAlert aria-hidden className="h-5 w-5 text-amber-600" />
              {signedInAs ? `Not your workspace` : `Sign in required`}
            </span>
          }
          description={`This area belongs to the ${ROLE_LABEL[role]} portal.`}
        />
        <CardContent className="space-y-4">
          {signedInAs ? (
            <p className="text-sm text-ink-600">
              You are signed in as <strong>{signedInAs.displayName}</strong> ({ROLE_LABEL[signedInAs.role]}). Open your
              own workspace, or sign in again with a {ROLE_LABEL[role]} demo account.
            </p>
          ) : (
            <p className="text-sm text-ink-600">
              Authentication here is mocked in the browser. Use the demo {ROLE_LABEL[role].toLowerCase()} account{' '}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">{DEMO_EMAIL[role]}</code> with the demo password —
              it is listed on the sign-in screen.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href={`/login?next=${ROLE_HOME[role]}`} className={cn(buttonVariants({ size: 'sm' }))}>
              Sign in as {ROLE_LABEL[role].toLowerCase()}
            </Link>
            {signedInAs ? (
              <Link href={ROLE_HOME[signedInAs.role]} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Go to my workspace
              </Link>
            ) : (
              <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Back to public site
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
