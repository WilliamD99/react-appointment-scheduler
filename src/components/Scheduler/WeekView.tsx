import { memo, useMemo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Appointment, TimeSlot } from '../../types/scheduler';
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
  /** Starting hour of the work day */
  startHour: number;
  /** Ending hour of the work day */
  endHour: number;
  /** Callback when an appointment is clicked */
  onAppointmentClick?: (appointment: Appointment) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  /** Currently selected appointment ID */
  selectedAppointmentId?: string | null;
  /** ID of appointment being dragged */
  draggingAppointmentId?: string | null;
}

/**
 * Single day column within the week view
 */
interface DayColumnProps {
  date: Date;
  appointments: Appointment[];
  slots: TimeSlot[];
  startHour: number;
  endHour: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  selectedAppointmentId?: string | null;
  draggingAppointmentId?: string | null;
}

const DayColumn = memo(function DayColumn({
  date,
  appointments,
  slots,
  startHour,
  endHour,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
}: DayColumnProps) {
  const isTodayDate = isToday(date);
  
  // Set up droppable zone for this day column
  // This enables cross-day drag-and-drop
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: { date },
  });
  
  // Calculate layouts for this day's appointments
  const layouts = useMemo(() => {
    const dayAppointments = filterAppointmentsByDay(appointments, date);
    const validAppointments = filterByWorkingHours(dayAppointments, startHour, endHour);
    return calculateAppointmentLayouts(validAppointments, startHour);
  }, [appointments, date, startHour, endHour]);

  const handleSlotClick = useCallback(
    (slot: TimeSlot) => {
      if (onSlotClick) {
        // Create a date for this specific day and time
        const slotTime = new Date(date);
        slotTime.setHours(slot.hour, slot.minute, 0, 0);
        const endTime = addMinutes(slotTime, SLOT_DURATION);
        onSlotClick(slotTime, endTime);
      }
    },
    [date, onSlotClick]
  );

  const gridHeight = slots.length * SLOT_HEIGHT;

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex-1 min-w-[120px] border-r border-stone-200 last:border-r-0
        transition-colors duration-150
        ${isOver ? 'bg-rose-50/30' : ''}
      `}
    >
      {/* Day header */}
      <div
        className={`
          sticky top-0 z-10 px-2 py-2 text-center border-b border-stone-200
          ${isTodayDate ? 'bg-rose-50' : isOver ? 'bg-rose-50/50' : 'bg-white'}
        `}
      >
        <span
          className={`
            text-sm font-medium
            ${isTodayDate ? 'text-rose-700' : 'text-stone-700'}
          `}
        >
          {formatShortDate(date)}
        </span>
        {isTodayDate && (
          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mx-auto mt-1" />
        )}
      </div>

      {/* Day grid */}
      <div className="relative" style={{ height: `${gridHeight}px` }}>
        {/* Slot backgrounds */}
        {slots.map((slot) => (
          <div
            key={`${date.toISOString()}-${slot.hour}-${slot.minute}`}
            className={`
              border-b transition-colors duration-100
              ${slot.isHourStart ? 'border-stone-300' : 'border-stone-200'}
              hover:bg-stone-100/50 cursor-pointer
            `}
            style={{ height: `${SLOT_HEIGHT}px` }}
            onClick={() => handleSlotClick(slot)}
            role="button"
            aria-label={`Create appointment on ${formatShortDate(date)} at ${slot.label}`}
          />
        ))}

        {/* Appointments */}
        <div className="absolute inset-0 pointer-events-none">
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
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
}: WeekViewProps) {
  // Get all dates for the week
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Generate time slots once for all columns
  const slots = useMemo(
    () => generateTimeSlots(selectedDate, startHour, endHour),
    [selectedDate, startHour, endHour]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header spacer + day headers row */}
      <div className="flex border-b border-stone-200 bg-white sticky top-0 z-20">
        {/* Time column header spacer */}
        <div className="w-20 flex-shrink-0 border-r border-stone-200" />
        
        {/* Day headers are now inside the columns */}
        <div className="flex-1" />
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-auto scheduler-scroll">
        <div className="flex min-w-full">
          {/* Sticky time column */}
          <div className="sticky left-0 z-20 bg-stone-50">
            {/* Spacer for day header row */}
            <div className="h-12 border-b border-stone-200" />
            <TimeColumn slots={slots} slotHeight={SLOT_HEIGHT} />
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {weekDates.map((date) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                appointments={appointments}
                slots={slots}
                startHour={startHour}
                endHour={endHour}
                onAppointmentClick={onAppointmentClick}
                onSlotClick={onSlotClick}
                selectedAppointmentId={selectedAppointmentId}
                draggingAppointmentId={draggingAppointmentId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WeekView;
