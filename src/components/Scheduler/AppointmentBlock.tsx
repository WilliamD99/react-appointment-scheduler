import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Appointment, AppointmentLayout } from '../../types/scheduler';
import { getServiceColors, getServiceDisplayName } from '../../utils/colorUtils';
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
  const colors = getServiceColors(appointment.serviceType);
  
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
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !isCurrentlyDragging) {
      onClick(appointment);
    }
  };

  // Determine if we have enough space to show details
  const isCompact = height < 50;
  const isVeryCompact = height < 35;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border-l-4 rounded-r-lg shadow-sm
        transition-all duration-150 ease-out
        overflow-hidden
        ${isCurrentlyDragging ? 'opacity-70 shadow-lg scale-[1.02] cursor-grabbing' : 'cursor-pointer'}
        ${isSelected ? 'ring-2 ring-stone-400 ring-offset-1' : ''}
        ${!isCurrentlyDragging ? colors.hoverBg : ''}
      `}
      onClick={handleClick}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${appointment.clientName}, ${getServiceDisplayName(appointment.serviceType)} at ${formatTime(appointment.startTime)}`}
    >
      <div className="p-2 h-full flex flex-col">
        {/* Service type badge */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`w-2 h-2 rounded-full ${colors.badge} flex-shrink-0`}
            aria-hidden="true"
          />
          {!isVeryCompact && (
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-75 truncate">
              {appointment.serviceType}
            </span>
          )}
        </div>

        {/* Client name */}
        <p className="font-semibold text-sm leading-tight truncate">
          {appointment.clientName}
        </p>

        {/* Time range and artist - only show if enough space */}
        {!isCompact && (
          <div className="mt-auto">
            <p className="text-xs opacity-75">
              {formatTime(appointment.startTime)} – {formatTime(endTime)}
            </p>
            {appointment.artist && (
              <p className="text-xs opacity-60 truncate mt-0.5">
                {appointment.artist}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default AppointmentBlock;
