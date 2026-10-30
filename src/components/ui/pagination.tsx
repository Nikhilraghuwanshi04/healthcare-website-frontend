import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (candidate) => candidate === 1 || candidate === pageCount || Math.abs(candidate - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-field border border-ink-300 text-ink-600 disabled:opacity-40 hover:enabled:bg-ink-50"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
      </button>
      <ul className="flex items-center gap-1">
        {pages.map((candidate, index) => {
          const previous = pages[index - 1];
          const gap = previous != null && candidate - previous > 1;
          return (
            <li key={candidate} className="flex items-center gap-1">
              {gap ? <span className="px-1 text-ink-400">…</span> : null}
              <button
                type="button"
                aria-current={candidate === page ? 'page' : undefined}
                onClick={() => onPageChange(candidate)}
                className={cn(
                  'h-8 min-w-8 rounded-field px-2 text-sm',
                  candidate === page ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                {candidate}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label="Next page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-field border border-ink-300 text-ink-600 disabled:opacity-40 hover:enabled:bg-ink-50"
      >
        <ChevronRight aria-hidden className="h-4 w-4" />
      </button>
    </nav>
  );
}
