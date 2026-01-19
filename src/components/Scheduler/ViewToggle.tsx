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
    <div className="view-toggle">
      <button
        type="button"
        onClick={() => onViewChange('day')}
        className={`view-toggle-btn ${view === 'day' ? 'active' : ''}`}
        aria-pressed={view === 'day'}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => onViewChange('week')}
        className={`view-toggle-btn ${view === 'week' ? 'active' : ''}`}
        aria-pressed={view === 'week'}
      >
        Week
      </button>
    </div>
  );
});

export default ViewToggle;
