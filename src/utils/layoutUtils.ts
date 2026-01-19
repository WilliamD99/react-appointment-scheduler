import type { Appointment, AppointmentLayout } from '../types/scheduler';
import { calculateTopPosition, calculateHeight, isSameDay } from './timeUtils';

/**
 * Layout utility functions for the scheduler
 * Handles overlap detection and position calculations for appointments
 */

/**
 * Gets the end time of an appointment
 */
function getEndTime(appointment: Appointment): Date {
  return new Date(
    appointment.startTime.getTime() + appointment.duration * 60 * 1000
  );
}


/**
 * Groups overlapping appointments together
 * Uses a union-find style approach to identify overlap clusters
 * 
 * @param appointments - Array of appointments to group
 * @returns Array of appointment groups (each group contains overlapping appointments)
 */
function groupOverlappingAppointments(
  appointments: Appointment[]
): Appointment[][] {
  if (appointments.length === 0) return [];
  
  // Sort by start time
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );
  
  const groups: Appointment[][] = [];
  let currentGroup: Appointment[] = [sorted[0]];
  let currentGroupEnd = getEndTime(sorted[0]).getTime();
  
  for (let i = 1; i < sorted.length; i++) {
    const appointment = sorted[i];
    const appointmentStart = appointment.startTime.getTime();
    
    // If this appointment starts before the current group ends, it overlaps
    if (appointmentStart < currentGroupEnd) {
      currentGroup.push(appointment);
      // Extend the group end time if this appointment ends later
      currentGroupEnd = Math.max(currentGroupEnd, getEndTime(appointment).getTime());
    } else {
      // Start a new group
      groups.push(currentGroup);
      currentGroup = [appointment];
      currentGroupEnd = getEndTime(appointment).getTime();
    }
  }
  
  // Don't forget the last group
  groups.push(currentGroup);
  
  return groups;
}

/**
 * Assigns lanes to appointments within an overlap group
 * Uses a greedy algorithm to minimize the number of lanes needed
 * 
 * @param group - Array of overlapping appointments
 * @returns Map of appointment ID to lane index
 */
function assignLanes(group: Appointment[]): Map<string, number> {
  // Sort by start time, then by duration (longer first for better visual layout)
  const sorted = [...group].sort((a, b) => {
    const startDiff = a.startTime.getTime() - b.startTime.getTime();
    if (startDiff !== 0) return startDiff;
    return b.duration - a.duration; // Longer appointments first
  });
  
  const lanes: Map<string, number> = new Map();
  const laneEndTimes: number[] = []; // Track when each lane becomes free
  
  for (const appointment of sorted) {
    const appointmentStart = appointment.startTime.getTime();
    
    // Find the first lane that's free (ends before this appointment starts)
    let assignedLane = -1;
    for (let i = 0; i < laneEndTimes.length; i++) {
      if (laneEndTimes[i] <= appointmentStart) {
        assignedLane = i;
        break;
      }
    }
    
    // If no free lane found, create a new one
    if (assignedLane === -1) {
      assignedLane = laneEndTimes.length;
      laneEndTimes.push(0);
    }
    
    lanes.set(appointment.id, assignedLane);
    laneEndTimes[assignedLane] = getEndTime(appointment).getTime();
  }
  
  return lanes;
}

/**
 * Calculates layout information for all appointments
 * Handles overlap detection and assigns lanes for proper positioning
 * 
 * @param appointments - Array of appointments to layout
 * @param gridStartHour - The hour the grid starts at (for calculating top position)
 * @returns Array of AppointmentLayout objects with position data
 */
export function calculateAppointmentLayouts(
  appointments: Appointment[],
  gridStartHour: number
): AppointmentLayout[] {
  if (appointments.length === 0) return [];
  
  // Group overlapping appointments
  const groups = groupOverlappingAppointments(appointments);
  
  const layouts: AppointmentLayout[] = [];
  
  for (const group of groups) {
    // Assign lanes within this group
    const lanes = assignLanes(group);
    const totalLanes = new Set(lanes.values()).size;
    
    // Create layout for each appointment in the group
    for (const appointment of group) {
      layouts.push({
        appointment,
        lane: lanes.get(appointment.id) ?? 0,
        totalLanes,
        top: calculateTopPosition(appointment.startTime, gridStartHour),
        height: calculateHeight(appointment.duration),
      });
    }
  }
  
  return layouts;
}

/**
 * Filters appointments to only those on a specific day
 * 
 * @param appointments - Array of all appointments
 * @param date - The date to filter for
 * @returns Appointments that occur on the given day
 */
export function filterAppointmentsByDay(
  appointments: Appointment[],
  date: Date
): Appointment[] {
  return appointments.filter((apt) => isSameDay(apt.startTime, date));
}

/**
 * Filters appointments to only those within working hours
 * Adjusts appointments that partially fall outside working hours
 * 
 * @param appointments - Array of appointments
 * @param startHour - Working hours start
 * @param endHour - Working hours end
 * @returns Appointments within working hours
 */
export function filterByWorkingHours(
  appointments: Appointment[],
  startHour: number,
  endHour: number
): Appointment[] {
  return appointments.filter((apt) => {
    const hour = apt.startTime.getHours();
    const endTime = getEndTime(apt);
    const endTimeHour = endTime.getHours();
    const endTimeMinute = endTime.getMinutes();
    
    // Check if appointment starts before working hours end
    // and ends after working hours start
    const startsBeforeEnd = hour < endHour;
    const endsAfterStart = 
      endTimeHour > startHour || 
      (endTimeHour === startHour && endTimeMinute > 0);
    
    return startsBeforeEnd && endsAfterStart && hour >= startHour;
  });
}

/**
 * Calculates the number of time slots for a given hour range
 * Each hour has 2 slots (30-minute intervals)
 */
export function calculateTotalSlots(startHour: number, endHour: number): number {
  return (endHour - startHour) * 2;
}

/**
 * Calculates total grid height in pixels
 */
export function calculateGridHeight(
  startHour: number,
  endHour: number,
  slotHeight: number
): number {
  return calculateTotalSlots(startHour, endHour) * slotHeight;
}
