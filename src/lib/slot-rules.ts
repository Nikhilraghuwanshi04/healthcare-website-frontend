import type { WeeklyDayWindow } from '@/types/common';
import { addMinutes, parseTime, toIsoDate } from './dates';

/** Start times for one clinic day. Slots never cross the closing time. */
export function daySlotStarts(window: WeeklyDayWindow, day: Date): Date[] {
  const opening = parseTime(window.start);
  const closing = parseTime(window.end);
  const starts: Date[] = [];

  let cursor = new Date(day);
  cursor.setHours(opening.hours, opening.minutes, 0, 0);
  const closeAt = new Date(day);
  closeAt.setHours(closing.hours, closing.minutes, 0, 0);

  while (cursor.getTime() + window.slotMinutes * 60_000 <= closeAt.getTime()) {
    starts.push(cursor);
    cursor = addMinutes(cursor, window.slotMinutes);
  }
  return starts;
}

/** Slot ids are derived, never stored, so availability always matches the calendar. */
export function slotIdOf(doctorId: string, start: Date): string {
  const hours = String(start.getHours()).padStart(2, '0');
  const minutes = String(start.getMinutes()).padStart(2, '0');
  return `${doctorId}@${toIsoDate(start)}T${hours}${minutes}`;
}

export function doctorIdFromSlotId(slotId: string): string {
  return slotId.split('@')[0];
}
