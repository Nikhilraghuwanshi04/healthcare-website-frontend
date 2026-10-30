const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;
export const WEEKDAY_LABELS = { short: WEEKDAY_SHORT, full: WEEKDAY_FULL } as const;
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export type TimeOfDay = { hours: number; minutes: number };

export function parseTime(value: string): TimeOfDay {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function formatClock(date: Date): string {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
}

export function formatDate(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${formatDate(date)} · ${formatClock(date)}`;
}

export function formatTimeRange(value: string | Date, durationMinutes: number): string {
  const start = typeof value === 'string' ? new Date(value) : new Date(value.getTime());
  return `${formatClock(start)} – ${formatClock(addMinutes(start, durationMinutes))}`;
}

/** "Today", "Tomorrow", then weekday labels — used across every slot surface. */
export function formatDayLabel(date: Date, reference = new Date()): string {
  const day = startOfDay(date).getTime();
  const today = startOfDay(reference).getTime();
  const diffDays = Math.round((day - today) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return WEEKDAY_SHORT[date.getDay()];
  return formatDate(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function daysUntil(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
}
