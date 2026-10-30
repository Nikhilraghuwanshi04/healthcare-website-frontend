import type { WeeklyAvailability, WeeklyDayWindow } from '@/types/common';

const MORNING_CLINIC: WeeklyDayWindow = { start: '09:00', end: '13:30', slotMinutes: 30 };
const FULL_DAY_CLINIC: WeeklyDayWindow = { start: '10:00', end: '17:30', slotMinutes: 30 };
const EVENING_CLINIC: WeeklyDayWindow = { start: '16:00', end: '21:00', slotMinutes: 30 };
const WEEKEND_CLINIC: WeeklyDayWindow = { start: '10:00', end: '14:00', slotMinutes: 45 };
const LONG_CONSULT_CLINIC: WeeklyDayWindow = { start: '11:00', end: '18:00', slotMinutes: 45 };

/** Closed days stay null so slot generation and the profile calendar agree. */
function build(days: number[], window: WeeklyDayWindow): WeeklyAvailability {
  return {
    0: days.includes(0) ? window : null,
    1: days.includes(1) ? window : null,
    2: days.includes(2) ? window : null,
    3: days.includes(3) ? window : null,
    4: days.includes(4) ? window : null,
    5: days.includes(5) ? window : null,
    6: days.includes(6) ? window : null,
  };
}

export const AVAILABILITY_PRESETS = {
  weekdayMorning: () => build([1, 2, 3, 4, 5], MORNING_CLINIC),
  weekdayFullDay: () => build([1, 2, 3, 4, 5], FULL_DAY_CLINIC),
  weekdayEvening: () => build([1, 2, 3, 4], EVENING_CLINIC),
  weekdaysPlusSaturday: () => build([1, 2, 3, 4, 5, 6], FULL_DAY_CLINIC),
  saturdaySunday: () => build([0, 6], WEEKEND_CLINIC),
  longerConsults: () => build([1, 3, 5], LONG_CONSULT_CLINIC),
} as const;
