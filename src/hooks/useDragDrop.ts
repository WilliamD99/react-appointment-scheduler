import { useState, useCallback, useMemo } from 'react';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import type { Appointment } from '../types/scheduler';
import { SLOT_HEIGHT, SLOT_DURATION, roundToSlot } from '../utils/timeUtils';

/**
 * Custom hook for managing drag-and-drop state and logic
 * 
 * Provides:
 * - Tracking of currently dragged appointment
 * - Calculation of new appointment time based on drop position
 * - Support for cross-day rescheduling in week view
 * - Snap-to-slot modifier for smooth dragging
 */

interface UseDragDropOptions {
  /** Starting hour of the work day (for bounds checking) */
  startHour: number;
  /** Ending hour of the work day (for bounds checking) */
  endHour: number;
  /** When set, bounds are taken from this per-day lookup (e.g. from businessHours) */
  getHoursForDate?: (date: Date) => { startHour: number; endHour: number };
  /** Callback when an appointment is successfully rescheduled */
  onReschedule?: (appointmentId: string, newStartTime: Date) => void;
}

interface UseDragDropReturn {
  /** ID of the appointment currently being dragged */
  draggingId: string | null;
  /** Handler for drag start events */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag end events */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Modifier to snap dragging to 30-minute slots */
  snapModifier: Modifier;
}

export function useDragDrop({
  startHour,
  endHour,
  getHoursForDate,
  onReschedule,
}: UseDragDropOptions): UseDragDropReturn {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  /**
   * Handle the start of a drag operation
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setDraggingId(active.id as string);
  }, []);

  /**
   * Handle the end of a drag operation
   * Calculates the new time based on the drag distance and drop target
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      setDraggingId(null);

      // No reschedule callback
      if (!onReschedule) {
        return;
      }

      const appointmentData = active.data.current as { appointment: Appointment } | undefined;
      if (!appointmentData?.appointment) {
        return;
      }

      const appointment = appointmentData.appointment;

      // Calculate time change based on vertical movement
      // Each SLOT_HEIGHT pixels = SLOT_DURATION minutes
      const slotsMovedY = Math.round(delta.y / SLOT_HEIGHT);
      const minutesChange = slotsMovedY * SLOT_DURATION;

      // Check if dropped on a day column (for cross-day movement)
      let targetDate: Date | null = null;
      if (over?.data?.current) {
        const dropData = over.data.current as { date?: Date };
        if (dropData.date) {
          targetDate = dropData.date;
        }
      }

      // If no movement and no day change, skip
      if (minutesChange === 0 && !targetDate) {
        return;
      }

      // Calculate new start time
      let newStartTime: Date;
      
      if (targetDate) {
        // Cross-day movement: use the target date but keep the time + offset
        newStartTime = new Date(targetDate);
        const originalHours = appointment.startTime.getHours();
        const originalMinutes = appointment.startTime.getMinutes();
        newStartTime.setHours(originalHours, originalMinutes, 0, 0);
        // Apply the vertical time offset
        newStartTime = new Date(newStartTime.getTime() + minutesChange * 60 * 1000);
      } else {
        // Same-day movement: just apply the time offset
        newStartTime = new Date(
          appointment.startTime.getTime() + minutesChange * 60 * 1000
        );
      }

      // Round to nearest slot
      const roundedStartTime = roundToSlot(newStartTime);

      // Validate the new time is within working hours (use per-day hours when available)
      const dateForHours = targetDate ?? appointment.startTime;
      const { startHour: boundsStart, endHour: boundsEnd } = getHoursForDate
        ? getHoursForDate(dateForHours)
        : { startHour, endHour };
      const newHour = roundedStartTime.getHours();
      const newMinute = roundedStartTime.getMinutes();
      const appointmentEndHour =
        newHour + Math.floor((newMinute + appointment.duration) / 60);

      if (newHour < boundsStart || appointmentEndHour > boundsEnd) {
        // Don't allow dragging outside working hours
        return;
      }

      // Check if anything actually changed
      if (roundedStartTime.getTime() === appointment.startTime.getTime()) {
        return;
      }

      // Call the reschedule callback
      onReschedule(appointment.id, roundedStartTime);
    },
    [onReschedule, startHour, endHour, getHoursForDate]
  );

  /**
   * Modifier that snaps dragging to 30-minute slot increments
   * This provides visual feedback that appointments snap to slots
   */
  const snapModifier: Modifier = useMemo(
    () =>
      ({ transform }) => {
        return {
          ...transform,
          // Snap Y movement to slot boundaries
          y: Math.round(transform.y / SLOT_HEIGHT) * SLOT_HEIGHT,
          // Keep X unchanged for free horizontal movement
          x: transform.x,
        };
      },
    []
  );

  return {
    draggingId,
    handleDragStart,
    handleDragEnd,
    snapModifier,
  };
}

export default useDragDrop;
