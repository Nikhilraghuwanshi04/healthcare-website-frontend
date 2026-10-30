import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const iconTone = {
    brand: 'bg-brand-50 text-brand-700',
    neutral: 'bg-ink-100 text-ink-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <div className="card-surface flex items-start gap-4 p-5">
      {icon ? <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-field', iconTone)}>{icon}</span> : null}
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
        {hint ? <p className="truncate text-xs text-ink-500">{hint}</p> : null}
      </div>
    </div>
  );
}
