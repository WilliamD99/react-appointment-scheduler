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
    <div
      className="sticky left-0 z-20 bg-stone-50 border-r border-stone-200 flex-shrink-0"
      style={{ width: '80px' }}
    >
      {slots.map((slot, index) => (
        <div
          key={`${slot.hour}-${slot.minute}`}
          className="relative flex items-start justify-end pr-3"
          style={{ height: `${slotHeight}px` }}
        >
          {/* Only show label at the start of each hour */}
          {slot.isHourStart && (
            <span className="text-xs font-medium text-stone-500 -mt-2 select-none">
              {slot.label}
            </span>
          )}
          
          {/* Hour divider line */}
          {slot.isHourStart && index > 0 && (
            <div className="absolute top-0 right-0 w-3 border-t border-stone-300" />
          )}
        </div>
      ))}
    </div>
  );
});

export default TimeColumn;
