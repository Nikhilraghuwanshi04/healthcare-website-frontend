import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-200">{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-ink-50/70', className)}>{children}</tr>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th scope="col" className={cn('px-4 py-3 font-medium', className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle text-ink-700', className)}>{children}</td>;
}
