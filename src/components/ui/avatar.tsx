import { cn, initialsOf } from '@/lib/utils';

const TONES = [
  'bg-brand-100 text-brand-800',
  'bg-sky-100 text-sky-900',
  'bg-emerald-100 text-emerald-900',
  'bg-amber-100 text-amber-900',
  'bg-violet-100 text-violet-900',
];

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-xl',
} as const;

/** Initial-based avatar: no remote images, so nothing to host or optimise. */
export function Avatar({
  name,
  seed,
  size = 'md',
  className,
}: {
  name: string;
  seed?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const tone = TONES[(seed ?? name).length % TONES.length];
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tone, SIZES[size], className)}
    >
      {initialsOf(name)}
    </span>
  );
}
