import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export function AuthScreen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid page-container gap-10 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="hidden space-y-6 lg:block">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-200">
          <ShieldAlert aria-hidden className="h-3.5 w-3.5" />
          Demo environment · mock sign-in, no real credentials
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-600">{description}</p>
        <ul className="space-y-3 text-sm text-ink-600">
          {[
            'Patients: search doctors, hold a slot, cancel when plans change.',
            'Doctors: see the day queue and confirm or decline requests.',
            'Admins: approve profiles, watch load, and resolve conflicts.',
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <p className="text-sm">
          Not sure yet?{' '}
          <Link href="/doctors" className="font-medium text-brand-700 hover:underline">
            Browse the directory first
          </Link>
        </p>
      </div>
      <div className="space-y-4">
        <div className="lg:hidden">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          <p className="mt-1 text-sm text-ink-600">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
