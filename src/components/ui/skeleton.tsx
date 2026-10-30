import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-field bg-ink-200/70', className)} />;
}

/** Placeholder blocks shaped like the content they replace. */
export function DoctorCardSkeleton() {
  return (
    <div className="card-surface space-y-4 p-5">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }, (_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card-surface space-y-2 p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}
