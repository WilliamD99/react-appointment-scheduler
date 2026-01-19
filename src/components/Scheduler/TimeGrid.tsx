import { memo, useMemo, useCallback } from 'react';
import type { TimeSlot, Appointment, AppointmentLayout } from '../../types/scheduler';
import { generateTimeSlots, SLOT_HEIGHT, addMinutes, SLOT_DURATION } from '../../utils/timeUtils';
import { calculateAppointmentLayouts, filterAppointmentsByDay, filterByWorkingHours } from '../../utils/layoutUtils';
import { TimeColumn } from './TimeColumn';
import { AppointmentBlock } from './AppointmentBlock';

/**
 * TimeGrid Component
 * 
 * Renders the main time grid with:
 * - Sticky time column on the left
 * - Time slots as rows (30-minute intervals)
 * - Appointment blocks positioned absolutely within the grid
 * - Click handlers for empty slots to create new appointments
 * 
 * This is the core layout engine for both DayView and WeekView.
 */

interface TimeGridProps {
  /** The date this grid represents */
  date: Date;
  /** All appointments to potentially display */
  appointments: Appointment[];
  /** Starting hour of the work day */
  startHour: number;
  /** Ending hour of the work day */
  endHour: number;
  /** Callback when an appointment is clicked */
  onAppointmentClick?: (appointment: Appointment) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  /** Currently selected appointment ID (for highlighting) */
  selectedAppointmentId?: string | null;
  /** ID of appointment being dragged (for visual feedback) */
  draggingAppointmentId?: string | null;
}

/**
 * Memoized TimeGrid component
 */
export const TimeGrid = memo(function TimeGrid({
  date,
  appointments,
  startHour,
  endHour,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
}: TimeGridProps) {
  // Generate time slots - memoized to avoid recalculation
  const slots: TimeSlot[] = useMemo(
    () => generateTimeSlots(date, startHour, endHour),
    [date, startHour, endHour]
  );

  // Filter and calculate layouts for appointments on this day
  const appointmentLayouts: AppointmentLayout[] = useMemo(() => {
    // Filter to appointments on this specific day
    const dayAppointments = filterAppointmentsByDay(appointments, date);
    
    // Filter to working hours only
    const validAppointments = filterByWorkingHours(
      dayAppointments,
      startHour,
      endHour
    );
    
    // Calculate positions and overlap lanes
    return calculateAppointmentLayouts(validAppointments, startHour);
  }, [appointments, date, startHour, endHour]);

  // Handle slot click - memoized callback
  const handleSlotClick = useCallback(
    (slot: TimeSlot) => {
      if (onSlotClick) {
        const endTime = addMinutes(slot.time, SLOT_DURATION);
        onSlotClick(slot.time, endTime);
      }
    },
    [onSlotClick]
  );

  // Handle appointment click - memoized callback
  const handleAppointmentClick = useCallback(
    (appointment: Appointment) => {
      if (onAppointmentClick) {
        onAppointmentClick(appointment);
      }
    },
    [onAppointmentClick]
  );

  // Calculate total grid height
  const gridHeight = slots.length * SLOT_HEIGHT;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Time column (sticky) */}
      <TimeColumn slots={slots} slotHeight={SLOT_HEIGHT} />

      {/* Main grid area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Slot rows (background grid) */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {slots.map((slot) => (
            <div
              key={`slot-${slot.hour}-${slot.minute}`}
              className={`grid-slot ${slot.isHourStart ? 'hour-start' : ''}`}
              style={{ height: `${SLOT_HEIGHT}px` }}
              onClick={() => handleSlotClick(slot)}
              role="button"
              aria-label={`Create appointment at ${slot.label}`}
            />
          ))}
        </div>

        {/* Appointment blocks layer */}
        <div
          className="appointments-layer"
          style={{ height: `${gridHeight}px` }}
        >
          {appointmentLayouts.map((layout) => (
            <AppointmentBlock
              key={layout.appointment.id}
              layout={layout}
              onClick={handleAppointmentClick}
              isSelected={selectedAppointmentId === layout.appointment.id}
              isDragging={draggingAppointmentId === layout.appointment.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default TimeGrid;
