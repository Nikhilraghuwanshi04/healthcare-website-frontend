import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-field border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-ink-100 disabled:text-ink-500';

export interface InputProps extends React.ComponentProps<'input'> {
  invalid?: boolean;
}

export function Input({ ref, invalid, className, type = 'text', ...props }: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, invalid && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20', className)}
      {...props}
    />
  );
}

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ ref, invalid, className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'min-h-24 resize-y', invalid && 'border-rose-500 focus:ring-rose-500/20', className)}
      {...props}
    />
  );
}

export interface SelectProps extends React.ComponentProps<'select'> {
  invalid?: boolean;
}

export function Select({ ref, invalid, className, children, ...props }: SelectProps) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'appearance-none pr-8 bg-no-repeat', className)}
      style={{
        backgroundImage:
          'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
        backgroundPosition: 'right 0.6rem center',
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export interface CheckboxProps extends React.ComponentProps<'input'> {
  invalid?: boolean;
}

export function Checkbox({ ref, invalid, className, type = 'checkbox', ...props }: CheckboxProps) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-4 w-4 shrink-0 rounded border-ink-300 accent-brand-600 focus-visible:outline-brand-600',
        invalid && 'border-rose-500',
        className,
      )}
      {...props}
    />
  );
}
