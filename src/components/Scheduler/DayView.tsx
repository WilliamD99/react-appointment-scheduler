import { memo, useMemo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Appointment, TimeSlot } from '../../types/scheduler';
import {
  formatFullDate,
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
 * DayView Component
 * 
 * Displays a single day's schedule with:
 * - Technician/artist columns on the x-axis
 * - Time of day on the y-axis
 * - Each column shows appointments for that technician
 * - Droppable zones for cross-technician drag-and-drop
 */

interface DayViewProps {
  /** The date to display */
  date: Date;
  /** All appointments (will be filtered to this day) */
  appointments: Appointment[];
  /** List of technician names for columns */
  technicians: string[];
  /** Starting hour of the work day */
  startHour: number;
  /** Ending hour of the work day */
  endHour: number;
  /** Callback when an appointment is clicked */
  onAppointmentClick?: (appointment: Appointment) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (startTime: Date, endTime: Date, technician?: string) => void;
  /** Currently selected appointment ID */
  selectedAppointmentId?: string | null;
  /** ID of appointment being dragged */
  draggingAppointmentId?: string | null;
}

/**
 * Single technician column within the day view
 */
interface TechnicianColumnProps {
  date: Date;
  technician: string;
  appointments: Appointment[];
  slots: TimeSlot[];
  startHour: number;
  endHour: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (startTime: Date, endTime: Date, technician?: string) => void;
  selectedAppointmentId?: string | null;
  draggingAppointmentId?: string | null;
}

const TechnicianColumn = memo(function TechnicianColumn({
  date,
  technician,
  appointments,
  slots,
  startHour,
  endHour,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
}: TechnicianColumnProps) {
  // Set up droppable zone for this technician column
  const { setNodeRef, isOver } = useDroppable({
    id: `tech-${technician}-${date.toISOString()}`,
    data: { date, technician },
  });

  // Filter appointments for this technician only
  const technicianAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.artist === technician);
  }, [appointments, technician]);

  // Calculate layouts for this technician's appointments
  const layouts = useMemo(() => {
    const dayAppointments = filterAppointmentsByDay(technicianAppointments, date);
    const validAppointments = filterByWorkingHours(dayAppointments, startHour, endHour);
    return calculateAppointmentLayouts(validAppointments, startHour);
  }, [technicianAppointments, date, startHour, endHour]);

  const handleSlotClick = useCallback(
    (slot: TimeSlot) => {
      if (onSlotClick) {
        const slotTime = new Date(date);
        slotTime.setHours(slot.hour, slot.minute, 0, 0);
        const endTime = addMinutes(slotTime, SLOT_DURATION);
        onSlotClick(slotTime, endTime, technician);
      }
    },
    [date, onSlotClick, technician]
  );

  const gridHeight = slots.length * SLOT_HEIGHT;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[180px] border-r border-stone-200 last:border-r-0
        transition-colors duration-150
        ${isOver ? 'bg-rose-50/30' : ''}
      `}
    >
      {/* Technician header */}
      <div
        className={`
          sticky top-0 z-10 px-3 py-3 text-center border-b border-stone-200
          ${isOver ? 'bg-rose-50/50' : 'bg-white'}
        `}
      >
        <span className="text-sm font-semibold text-stone-800">
          {technician}
        </span>
      </div>

      {/* Time grid for this technician */}
      <div className="relative" style={{ height: `${gridHeight}px` }}>
        {/* Slot backgrounds */}
        {slots.map((slot) => (
          <div
            key={`${technician}-${slot.hour}-${slot.minute}`}
            className={`
              border-b transition-colors duration-100
              ${slot.isHourStart ? 'border-stone-300' : 'border-stone-200'}
              hover:bg-stone-100/50 cursor-pointer
            `}
            style={{ height: `${SLOT_HEIGHT}px` }}
            onClick={() => handleSlotClick(slot)}
            role="button"
            aria-label={`Create appointment for ${technician} at ${slot.label}`}
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

export const DayView = memo(function DayView({
  date,
  appointments,
  technicians,
  startHour,
  endHour,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
  draggingAppointmentId,
}: DayViewProps) {
  // Check if this is today for special styling
  const isTodayDate = useMemo(() => isToday(date), [date]);
  const formattedDate = useMemo(() => formatFullDate(date), [date]);

  // Generate time slots once for all columns
  const slots = useMemo(
    () => generateTimeSlots(date, startHour, endHour),
    [date, startHour, endHour]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3 ml-20">
          <h2 className="text-lg font-semibold text-stone-800">
            {formattedDate}
          </h2>
          {isTodayDate && (
            <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Scrollable area with technician columns */}
      <div className="flex-1 overflow-auto scheduler-scroll">
        <div className="flex min-w-full">
          {/* Sticky time column */}
          <div className="sticky left-0 z-20 bg-stone-50">
            {/* Spacer for technician header row */}
            <div className="h-12 border-b border-stone-200" />
            <TimeColumn slots={slots} slotHeight={SLOT_HEIGHT} />
          </div>

          {/* Technician columns */}
          <div className="flex flex-1">
            {technicians.map((technician) => (
              <TechnicianColumn
                key={technician}
                date={date}
                technician={technician}
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

export default DayView;
