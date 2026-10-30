import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

import { cn } from '@/lib/utils';

export function SiteLogo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2 text-base font-semibold tracking-tight text-ink-900', className)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-field bg-brand-600 text-white">
        <Stethoscope aria-hidden className="h-4.5 w-4.5" />
      </span>
      Medibook
    </Link>
  );
}
