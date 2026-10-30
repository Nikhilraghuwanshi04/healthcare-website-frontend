'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { addMinutes, formatClock, formatDayLabel, toIsoDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { AppointmentSlot } from '@/types/doctor';

interface DayGroup {
  date: string;
  label: string;
  slots: AppointmentSlot[];
  availableCount: number;
}

/** Groups a flat slot list by local calendar day, oldest first. */
function groupByDay(slots: AppointmentSlot[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const slot of slots) {
    const start = new Date(slot.startAt);
    const date = toIsoDate(start);
    const group = groups.get(date) ?? { date, label: formatDayLabel(start), slots: [], availableCount: 0 };
    group.slots.push(slot);
    if (slot.status === 'available') group.availableCount += 1;
    groups.set(date, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Shared availability grid for the doctor profile and the booking wizard:
 * a day strip plus the slots for the chosen day.
 */
export function SlotPicker({
  slots,
  loading,
  selectedSlotId,
  onSelect,
}: {
  slots: AppointmentSlot[];
  loading: boolean;
  selectedSlotId: string | null;
  onSelect: (slot: AppointmentSlot) => void;
}) {
  const days = useMemo(() => groupByDay(slots), [slots]);
  const firstOpenDay = days.find((day) => day.availableCount > 0)?.date ?? days[0]?.date ?? '';
  const [activeDay, setActiveDay] = useState(firstOpenDay);
  const currentDay = days.find((day) => day.date === activeDay) ?? days[0];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={`slot-skeleton-${index}`} className="h-9" />
          ))}
        </div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <p className="rounded-field border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
        This doctor has no bookable days in the displayed window.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Choose a day" className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const selected = day.date === currentDay?.date;
          return (
            <button
              key={day.date}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveDay(day.date)}
              className={cn(
                'shrink-0 rounded-field border px-3 py-2 text-left text-sm transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400',
              )}
            >
              <span className="block font-medium">{day.label}</span>
              <span className={cn('block text-xs', day.availableCount === 0 ? 'text-ink-400' : 'text-brand-700')}>
                {day.availableCount === 0 ? 'Full' : `${day.availableCount} open`}
              </span>
            </button>
          );
        })}
      </div>

      {currentDay && currentDay.slots.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {currentDay.slots.map((slot) => {
            const start = new Date(slot.startAt);
            const disabled = slot.status !== 'available';
            const selected = slot.id === selectedSlotId;
            return (
              <li key={slot.id}>
                <Button
                  type="button"
                  variant={selected ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onSelect(slot)}
                  title={
                    slot.status === 'booked'
                      ? 'Already booked'
                      : slot.status === 'closed'
                        ? 'Too late to book in this demo'
                        : undefined
                  }
                >
                  {formatClock(start)}
                  <span className="sr-only"> to {formatClock(addMinutes(start, slot.durationMinutes))}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-500">No slots on {currentDay?.label ?? 'this day'}.</p>
      )}

      <p className="text-xs text-ink-500">
        Times are your local timezone. Grey slots are already booked or inside the two-hour lead time this demo
        enforces.
      </p>
    </div>
  );
}
