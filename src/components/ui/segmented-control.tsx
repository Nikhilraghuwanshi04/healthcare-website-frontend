'use client';

import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-1 rounded-field bg-ink-100 p-1', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[calc(var(--radius-field)-2px)] px-3 py-1.5 text-sm font-medium transition-colors',
              selected ? 'bg-white text-ink-900 shadow-card' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {option.label}
            {option.count != null ? <span className="ml-1.5 text-xs text-ink-500">{option.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
