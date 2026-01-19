/**
 * Scheduler Component Exports
 * 
 * Main export for the lash studio scheduler viewer.
 */

// Main component
export { Scheduler } from './Scheduler';

// Sub-components (for advanced customization)
export { DayView } from './DayView';
export { WeekView } from './WeekView';
export { TimeGrid } from './TimeGrid';
export { TimeColumn } from './TimeColumn';
export { AppointmentBlock } from './AppointmentBlock';
export { ViewToggle } from './ViewToggle';
export { DetailModal } from './DetailModal';
export { DetailPanel } from './DetailPanel';
export { CreateAppointmentModal } from './CreateAppointmentModal';
export { DatePickerModal } from './DatePickerModal';

// Re-export types
export type {
  Appointment,
  SchedulerProps,
  ServiceType,
  ViewMode,
  DetailDisplayMode,
  AppointmentLayout,
  TimeSlot,
  NewAppointmentData,
} from '../../types/scheduler';

// Re-export hooks for advanced usage
export { useScheduler } from '../../hooks/useScheduler';
export { useDragDrop } from '../../hooks/useDragDrop';

// Re-export utilities for custom implementations
export * from '../../utils/timeUtils';
export * from '../../utils/layoutUtils';
export * from '../../utils/colorUtils';
