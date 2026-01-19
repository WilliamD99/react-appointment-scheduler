import type { TimeSlot } from '../types/scheduler';

/**
 * Time utility functions for the scheduler
 * Handles time calculations, formatting, and slot generation
 */

/** Height of each 30-minute slot in pixels */
export const SLOT_HEIGHT = 60;

/** Duration of each slot in minutes */
export const SLOT_DURATION = 30;

/**
 * Formats a Date to a 12-hour time string (e.g., "9:00 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a Date to a short date string (e.g., "Mon 15")
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a Date to a full date string (e.g., "Monday, January 15, 2024")
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generates time slots for the given hour range
 * Creates 30-minute intervals from startHour to endHour
 * 
 * @param date - The base date for the slots
 * @param startHour - Starting hour (0-23)
 * @param endHour - Ending hour (0-23)
 * @returns Array of TimeSlot objects
 */
export function generateTimeSlots(
  date: Date,
  startHour: number,
  endHour: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);
      
      slots.push({
        time: slotTime,
        hour,
        minute,
        label: formatTime(slotTime),
        isHourStart: minute === 0,
      });
    }
  }
  
  return slots;
}

/**
 * Calculates the top position in pixels for an appointment
 * based on its start time relative to the grid's start hour
 * 
 * @param startTime - The appointment's start time
 * @param gridStartHour - The hour the grid starts at
 * @returns Top position in pixels
 */
export function calculateTopPosition(
  startTime: Date,
  gridStartHour: number
): number {
  const appointmentHour = startTime.getHours();
  const appointmentMinute = startTime.getMinutes();
  
  // Calculate total minutes from grid start
  const minutesFromStart = 
    (appointmentHour - gridStartHour) * 60 + appointmentMinute;
  
  // Convert to pixels (each 30 min = SLOT_HEIGHT pixels)
  return (minutesFromStart / SLOT_DURATION) * SLOT_HEIGHT;
}

/**
 * Calculates the height in pixels for an appointment based on its duration
 * 
 * @param durationMinutes - Duration in minutes
 * @returns Height in pixels
 */
export function calculateHeight(durationMinutes: number): number {
  return (durationMinutes / SLOT_DURATION) * SLOT_HEIGHT;
}

/**
 * Gets the start of the day (midnight) for a given date
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of the day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets an array of dates for the week containing the given date
 * Week starts on Sunday
 * 
 * @param date - Any date in the desired week
 * @returns Array of 7 Date objects (Sun-Sat)
 */
export function getWeekDates(date: Date): Date[] {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDates.push(day);
  }
  
  return weekDates;
}

/**
 * Adds minutes to a date and returns a new Date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Rounds a date to the nearest 30-minute slot
 */
export function roundToSlot(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const roundedMinutes = Math.round(minutes / SLOT_DURATION) * SLOT_DURATION;
  result.setMinutes(roundedMinutes, 0, 0);
  return result;
}

/**
 * Checks if a time is within working hours
 */
export function isWithinWorkingHours(
  time: Date,
  startHour: number,
  endHour: number
): boolean {
  const hour = time.getHours();
  const minute = time.getMinutes();
  
  if (hour < startHour) return false;
  if (hour >= endHour) return false;
  
  // Check if the time is exactly at the end hour with 0 minutes
  if (hour === endHour && minute === 0) return false;
  
  return true;
}

/**
 * Creates a Date object from a date and separate hour/minute values
 */
export function createDateTime(
  date: Date,
  hour: number,
  minute: number
): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Gets today's date at midnight
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
