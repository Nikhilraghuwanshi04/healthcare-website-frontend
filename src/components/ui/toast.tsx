'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONES = {
  success: { icon: CheckCircle2, className: 'text-emerald-600' },
  error: { icon: AlertTriangle, className: 'text-rose-600' },
  info: { icon: Info, className: 'text-sky-600' },
} as const;

const TIMEOUT_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const timers = useRef<number[]>([]);

  const push = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, tone, title, description }]);
    timers.current.push(window.setTimeout(() => dismiss(id), TIMEOUT_MS));
  }, [dismiss]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const api: ToastApi = {
    success: (title, description) => push('success', title, description),
    error: (title, description) => push('error', title, description),
    info: (title, description) => push('info', title, description),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-ink-200 bg-white p-4 shadow-raised"
            >
              <Icon aria-hidden className={cn('mt-0.5 h-5 w-5 shrink-0', className)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-sm text-ink-600">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-field p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
