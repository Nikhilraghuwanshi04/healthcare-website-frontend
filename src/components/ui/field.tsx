import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
        {optional ? <span className="ml-1 text-xs font-normal text-ink-500">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface FieldGroupProps {
  legend: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Legend-based grouping for checkbox sets (consultation modes, working days). */
export function FieldGroup({ legend, hint, error, className, children }: FieldGroupProps) {
  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-sm font-medium text-ink-700">{legend}</legend>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : hint ? <p className="text-sm text-ink-500">{hint}</p> : null}
    </fieldset>
  );
}

export function CheckboxRow({
  id,
  label,
  description,
  ...props
}: React.ComponentProps<'input'> & { id: string; label: string; description?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 accent-brand-600"
        {...props}
      />
      <label htmlFor={id} className="text-sm text-ink-800">
        <span className="font-medium">{label}</span>
        {description ? <span className="block text-ink-500">{description}</span> : null}
      </label>
    </div>
  );
}

export function RadioRow({
  id,
  label,
  description,
  ...props
}: React.ComponentProps<'input'> & { id: string; label: string; description?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="radio" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" {...props} />
      <label htmlFor={id} className="text-sm text-ink-800">
        <span className="font-medium">{label}</span>
        {description ? <span className="block text-ink-500">{description}</span> : null}
      </label>
    </div>
  );
}
