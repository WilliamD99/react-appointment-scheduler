import { memo, useMemo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Appointment, TimeSlot, Technician } from '../../types/scheduler';
import {
  getWeekDates,
  formatShortDate,
  isToday,
  generateTimeSlots,
  SLOT_HEIGHT,
  addMinutes,
  SLOT_DURATION,
} from '../../utils/timeUtils';
import {
  calculateAppointmentLayouts,
  filterAppointmentsByDay,
  filterByWorkingHours,
} from '../../utils/layoutUtils';
import { getTechnicianColorForAppointment } from '../../utils/colorUtils';
import { TimeColumn } from './TimeColumn';
import { AppointmentBlock } from './AppointmentBlock';

/**
 * WeekView Component
 * 
 * Displays a full week's schedule with:
 * - 7 day columns (Sunday to Saturday)
 * - Shared time column on the left
 * - Each day column shows appointments for that day
 * - Day headers with date and "Today" indicator
 * - Droppable zones for cross-day drag-and-drop
 * 
 * Layout: Time column is sticky, day columns scroll horizontally if needed
 */

interface WeekViewProps {
  /** The date used to determine which week to display */
  selectedDate: Date;
  /** All appointments (will be filtered per day) */
  appointments: Appointment[];
  /** Starting hour of the work day (union range for time column) */
  startHour: number;
  /** Ending hour of the work day (union range for time column) */
  endHour: number;
  /** When set, each day column uses this day's open/close; slots outside are disabled */
  getHoursForDate?: (date: Date) => { startHour: number; endHour: number };
  /** Callback when an appointment is clicked */
  onAppointmentClick?: (appointment: Appointment) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  /** Currently selected appointment ID */
  selectedAppointmentId?: string | null;
  /** ID of appointment being dragged */
  draggingAppointmentId?: string | null;
  /** Selected date range for highlighting (week view) */
  selectedDateRange?: { start: Date; end: Date } | null;
  /** List of technicians (used to resolve block color per technician) */
  technicians?: Technician[];
}

/**
 * Single day column within the week view
 */
interface DayColumnProps {
  date: Date;
  appointments: Appointment[];
  slots: TimeSlot[];
  /** Hour range for the time column (union); slots outside day range are disabled */
  startHour: number;
  endHour: number;
  /** This day's open/close; when set, slots outside [dayStartHour, dayEndHour) are disabled */
  dayStartHour?: number;
  dayEndHour?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  selectedAppointmentId?: string | null;
  draggingAppointmentId?: string | null;
  /** Whether this day is within the selected date range */
  isInSelectedRange?: boolean;
  technicians?: Technician[];
}

const DayColumn = memo(function DayColumn({
  date,
  appointments,
  slots,
  startHour,
  endHour,
  dayStartHour,
  dayEndHour,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
  isInSelectedRange,
  technicians = [],
}: DayColumnProps) {
  const isTodayDate = isToday(date);
  const effectiveStart = dayStartHour ?? startHour;
  const effectiveEnd = dayEndHour ?? endHour;

  // Set up droppable zone for this day column
  // This enables cross-day drag-and-drop
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: { date },
  });

  // Provide a safe ref callback in case DndContext is not available
  const safeSetNodeRef = setNodeRef || (() => { });

  // Calculate layouts for this day's appointments (position by union grid startHour; filter by this day's hours)
  const layouts = useMemo(() => {
    const dayAppointments = filterAppointmentsByDay(appointments, date);
    const validAppointments = filterByWorkingHours(dayAppointments, effectiveStart, effectiveEnd);
    const raw = calculateAppointmentLayouts(validAppointments, startHour);
    return raw.map((layout) => ({
      ...layout,
      color: getTechnicianColorForAppointment(layout.appointment, technicians),
    }));
  }, [appointments, date, startHour, effectiveStart, effectiveEnd, technicians]);

  const handleSlotClick = useCallback(
    (slot: TimeSlot) => {
      if (!onSlotClick) return;
      const inRange = slot.hour >= effectiveStart && slot.hour < effectiveEnd;
      if (!inRange) return;
      const slotTime = new Date(date);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);
      const endTime = addMinutes(slotTime, SLOT_DURATION);
      onSlotClick(slotTime, endTime);
    },
    [date, onSlotClick, effectiveStart, effectiveEnd]
  );

  const gridHeight = slots.length * SLOT_HEIGHT;

  return (
    <div
      ref={safeSetNodeRef}
      className={`day-column ${isOver ? 'drag-over' : ''} ${isInSelectedRange ? 'in-selected-range' : ''}`}
    >
      {/* Day header */}
      <div className={`column-header ${isTodayDate ? 'today' : ''} ${isOver ? 'drag-over' : ''} ${isInSelectedRange ? 'in-selected-range' : ''}`}>
        <span className={`column-header-text ${isTodayDate ? 'today' : ''} ${isInSelectedRange ? 'in-selected-range' : ''}`}>
          {formatShortDate(date)}
        </span>
        {isTodayDate && <div className="today-dot" />}
        {isInSelectedRange && !isTodayDate && <div className="selected-range-dot" />}
      </div>

      {/* Day grid */}
      <div className="grid-slots" style={{ height: `${gridHeight}px` }}>
        {/* Slot backgrounds */}
        {slots.map((slot) => {
          const outsideHours = slot.hour < effectiveStart || slot.hour >= effectiveEnd;
          return (
            <div
              key={`${date.toISOString()}-${slot.hour}-${slot.minute}`}
              className={`grid-slot ${slot.isHourStart ? 'hour-start' : ''} ${outsideHours ? 'slot-outside-hours' : ''}`}
              style={{ height: `${SLOT_HEIGHT}px` }}
              onClick={() => handleSlotClick(slot)}
              role="button"
              aria-label={outsideHours ? undefined : `Create appointment on ${formatShortDate(date)} at ${slot.label}`}
              aria-disabled={outsideHours ? true : undefined}
            />
          );
        })}

        {/* Appointments */}
        <div className="appointments-layer">
          {layouts.map((layout) => (
            <AppointmentBlock
              key={layout.appointment.id}
              layout={layout}
              onClick={onAppointmentClick}
              isSelected={selectedAppointmentId === layout.appointment.id}
              isDragging={draggingAppointmentId === layout.appointment.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export const WeekView = memo(function WeekView({
  selectedDate,
  appointments,
  startHour,
  endHour,
  getHoursForDate,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
  selectedDateRange,
  technicians = [],
}: WeekViewProps) {
  // Get all dates for the week
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Generate time slots once for all columns (union range)
  const slots = useMemo(
    () => generateTimeSlots(selectedDate, startHour, endHour),
    [selectedDate, startHour, endHour]
  );

  // Helper to check if a date is within the selected range
  const isDateInSelectedRange = useCallback((date: Date): boolean => {
    if (!selectedDateRange) return false;
    const { start, end } = selectedDateRange;
    // Normalize to start of day for comparison
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const rangeStart = new Date(start);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(end);
    rangeEnd.setHours(0, 0, 0, 0);
    return dateStart >= rangeStart && dateStart <= rangeEnd;
  }, [selectedDateRange]);

  return (
    <div className="view-container">
      {/* Header spacer + day headers row */}
      <div className="week-header-bar">
        {/* Time column header spacer */}
        <div className="week-header-spacer" />

        {/* Day headers are now inside the columns */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Scrollable area */}
      <div className="view-scroll-area scheduler-scroll">
        <div className="view-grid-container">
          {/* Sticky time column */}
          <div className="time-column" style={{ position: 'sticky', left: 0, zIndex: 20 }}>
            {/* Spacer for day header row */}
            <div className="time-column-spacer" />
            <TimeColumn slots={slots} slotHeight={SLOT_HEIGHT} />
          </div>

          {/* Day columns */}
          <div className="columns-container">
            {weekDates.map((date) => {
              const dayHours = getHoursForDate?.(date);
              return (
                <DayColumn
                  key={date.toISOString()}
                  date={date}
                  appointments={appointments}
                  slots={slots}
                  startHour={startHour}
                  endHour={endHour}
                  dayStartHour={dayHours?.startHour}
                  dayEndHour={dayHours?.endHour}
                  onAppointmentClick={onAppointmentClick}
                  onSlotClick={onSlotClick}
                  selectedAppointmentId={selectedAppointmentId}
                  draggingAppointmentId={draggingAppointmentId}
                  isInSelectedRange={isDateInSelectedRange(date)}
                  technicians={technicians}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WeekView;
