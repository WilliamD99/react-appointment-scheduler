import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Appointment, AppointmentLayout } from '../../types/scheduler';
import { getServiceDisplayName, DEFAULT_TECHNICIAN_COLOR } from '../../utils/colorUtils';
import { getArtistDisplayName } from '../../utils/artistUtils';
import { formatTime, addMinutes } from '../../utils/timeUtils';

/**
 * AppointmentBlock Component
 * 
 * Renders a single appointment as a positioned block within the time grid.
 * 
 * Features:
 * - Positioned absolutely based on start time and duration
 * - Handles overlapping appointments by adjusting width and horizontal position
 * - Color-coded by service type
 * - Draggable for rescheduling (uses @dnd-kit)
 * - Displays client name, service type, and time range
 */

interface AppointmentBlockProps {
  /** Layout information including position and overlap data */
  layout: AppointmentLayout;
  /** Callback when the appointment is clicked */
  onClick?: (appointment: Appointment) => void;
  /** Whether this appointment is currently selected */
  isSelected?: boolean;
  /** Whether this appointment is being dragged */
  isDragging?: boolean;
}

/**
 * Memoized AppointmentBlock for performance
 */
export const AppointmentBlock = memo(function AppointmentBlock({
  layout,
  onClick,
  isSelected = false,
  isDragging = false,
}: AppointmentBlockProps) {
  const { appointment, lane, totalLanes, top, height } = layout;
  const blockColor = layout.color ?? DEFAULT_TECHNICIAN_COLOR;

  // Set up draggable behavior with @dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingLocal,
  } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });

  // Provide a safe ref callback in case DndContext is not available
  const safeSetNodeRef = setNodeRef || (() => { });

  // Calculate end time for display
  const endTime = addMinutes(appointment.startTime, appointment.duration);

  // Calculate horizontal position and width based on lane assignment
  // Adds small gaps between overlapping appointments for visual clarity
  const gapSize = 2; // pixels between lanes
  const availableWidth = 100; // percentage
  const laneWidth = (availableWidth - (totalLanes - 1) * 0.5) / totalLanes;
  const leftPosition = lane * (laneWidth + 0.5);

  // Combine local and prop-based dragging state
  const isCurrentlyDragging = isDragging || isDraggingLocal;

  // Build transform style for drag preview
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${top}px`,
    left: `${leftPosition}%`,
    width: `${laneWidth}%`,
    height: `${Math.max(height - gapSize, 30)}px`, // Minimum height of 30px
    zIndex: isCurrentlyDragging ? 100 : isSelected ? 50 : 10,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    pointerEvents: 'auto',
    ['--block-color' as string]: blockColor,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !isCurrentlyDragging) {
      onClick(appointment);
    }
  };

  // Determine if we have enough space to show details
  // const isCompact = height < 50;
  // const isVeryCompact = height < 35;

  const classNames = [
    'appointment-block',
    'technician-color',
    isCurrentlyDragging ? 'dragging' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={safeSetNodeRef}
      style={style}
      className={classNames}
      onClick={handleClick}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${appointment.client.name}, ${getServiceDisplayName(appointment.serviceType)} at ${formatTime(appointment.startTime)}`}
    >
      <div className="appointment-content">
        {/* Service type badge */}
        <div className="appointment-badge">
          <span className="appointment-badge-dot" aria-hidden="true" />
          <span className="appointment-badge-text">
            {appointment.serviceType}
          </span>

        </div>

        {/* Client name */}
        <p className="appointment-client">
          {appointment.client.name}
        </p>

        {/* Time range and artist - only show if enough space */}
        <div className="appointment-details">
          <p className="appointment-time">
            {formatTime(appointment.startTime)} – {formatTime(endTime)}
          </p>
          {getArtistDisplayName(appointment.artist) && (
            <p className="appointment-artist">
              {getArtistDisplayName(appointment.artist)}
            </p>
          )}
        </div>

      </div>
    </div>
  );
});

export default AppointmentBlock;
