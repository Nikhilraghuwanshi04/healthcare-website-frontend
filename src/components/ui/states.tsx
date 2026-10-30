import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';

import { Button } from './button';
import { Card } from './card';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        {icon ?? <Inbox aria-hidden className="h-5 w-5" />}
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-ink-500">{description}</p>
      </div>
      {action}
    </Card>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 border-rose-200 bg-rose-50/40 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <AlertTriangle aria-hidden className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-ink-600">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
