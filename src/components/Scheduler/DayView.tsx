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

  // Provide a safe ref callback in case DndContext is not available
  const safeSetNodeRef = setNodeRef || (() => { });

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
      ref={safeSetNodeRef}
      className={`tech-column ${isOver ? 'drag-over' : ''}`}
    >
      {/* Technician header */}
      <div className={`column-header ${isOver ? 'drag-over' : ''}`}>
        <span className="tech-header-text">{technician}</span>
      </div>

      {/* Time grid for this technician */}
      <div className="grid-slots" style={{ height: `${gridHeight}px` }}>
        {/* Slot backgrounds */}
        {slots.map((slot) => (
          <div
            key={`${technician}-${slot.hour}-${slot.minute}`}
            className={`grid-slot ${slot.isHourStart ? 'hour-start' : ''}`}
            style={{ height: `${SLOT_HEIGHT}px` }}
            onClick={() => handleSlotClick(slot)}
            role="button"
            aria-label={`Create appointment for ${technician} at ${slot.label}`}
          />
        ))}

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
    <div className="view-container">
      {/* Day header */}
      <div className="view-header">
        <div className="view-header-content">
          <h2 className="view-header-title">{formattedDate}</h2>
          {isTodayDate && (
            <span className="today-badge">Today</span>
          )}
        </div>
      </div>

      {/* Scrollable area with technician columns */}
      <div className="view-scroll-area scheduler-scroll">
        <div className="view-grid-container">
          {/* Sticky time column */}
          <div className="time-column" style={{ position: 'sticky', left: 0, zIndex: 20 }}>
            {/* Spacer for technician header row */}
            <div className="time-column-spacer" />
            <TimeColumn slots={slots} slotHeight={SLOT_HEIGHT} />
          </div>

          {/* Technician columns */}
          <div className="columns-container">
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
