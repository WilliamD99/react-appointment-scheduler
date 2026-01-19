import { memo } from 'react';
import type { TimeSlot } from '../../types/scheduler';

/**
 * TimeColumn Component
 * 
 * Renders the sticky time labels column on the left side of the scheduler.
 * Displays hour labels and provides visual anchors for the time grid.
 * 
 * Uses position: sticky for smooth horizontal scrolling while keeping
 * time labels always visible.
 */

interface TimeColumnProps {
  /** Array of time slots to display labels for */
  slots: TimeSlot[];
  /** Height of each slot in pixels */
  slotHeight: number;
}

/**
 * Memoized TimeColumn to prevent unnecessary re-renders
 * The time column rarely changes, so memoization provides good optimization
 */
export const TimeColumn = memo(function TimeColumn({
  slots,
  slotHeight,
}: TimeColumnProps) {
  return (
    <div className="time-column" style={{ width: '80px' }}>
      {slots.map((slot, index) => (
        <div
          key={`${slot.hour}-${slot.minute}`}
          className="time-slot-label"
          style={{ height: `${slotHeight}px` }}
        >
          {/* Only show label at the start of each hour */}
          {slot.isHourStart && (
            <span>{slot.label}</span>
          )}
          
          {/* Hour divider line */}
          {slot.isHourStart && index > 0 && (
            <div className="time-slot-divider" />
          )}
        </div>
      ))}
    </div>
  );
});

export default TimeColumn;
