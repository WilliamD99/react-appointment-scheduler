import { memo } from 'react';
import type { ViewMode } from '../../types/scheduler';

/**
 * ViewToggle Component
 * 
 * A toggle button group for switching between Day and Week views.
 * Styled to match the minimal, elegant aesthetic of a beauty business.
 */

interface ViewToggleProps {
  /** Current active view */
  view: ViewMode;
  /** Callback when view is changed */
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle = memo(function ViewToggle({
  view,
  onViewChange,
}: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-stone-100 p-1">
      <button
        type="button"
        onClick={() => onViewChange('day')}
        className={`
          px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${
            view === 'day'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }
        `}
        aria-pressed={view === 'day'}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => onViewChange('week')}
        className={`
          px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${
            view === 'week'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }
        `}
        aria-pressed={view === 'week'}
      >
        Week
      </button>
    </div>
  );
});

export default ViewToggle;
