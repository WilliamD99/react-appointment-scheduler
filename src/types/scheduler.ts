/**
 * Core types for the Lash Studio Scheduler component
 */

/** Available lash service types */
export type ServiceType = string;

/** View modes for the scheduler */
export type ViewMode = 'day' | 'week';

/** Detail display modes */
export type DetailDisplayMode = 'modal' | 'panel';

/**
 * Represents a single appointment in the scheduler
 */
export interface Appointment {
  /** Unique identifier for the appointment */
  id: string;
  /** Name of the client */
  clientName: string;
  /** Type of lash service being performed */
  serviceType: ServiceType;
  /** Name of the lash artist (optional for multi-artist support) */
  artist?: string;
  /** Start time of the appointment */
  startTime: Date;
  /** Duration of the appointment in minutes */
  duration: number;
  /** Optional notes about the appointment */
  notes?: string;
  /** Optional phone number for client contact */
  phone?: string;
  /** Email address for client contact */
  email: string;
}

/**
 * Data for creating a new appointment (without ID)
 */
export interface NewAppointmentData {
  clientName: string;
  serviceType: ServiceType;
  artist?: string;
  startTime: Date;
  duration: number;
  email: string;
  phone?: string;
  notes?: string;
}

/**
 * Props for the main Scheduler component
 */
export interface SchedulerProps {
  /** Array of appointments to display */
  appointments: Appointment[];
  /** List of technician/artist names for day view columns */
  technicians?: string[];
  /** List of available service types */
  services: string[];
  /** Starting hour of the work day (default: 8 for 8 AM) */
  startHour?: number;
  /** Ending hour of the work day (default: 21 for 9 PM) */
  endHour?: number;
  /** Current view mode */
  view?: ViewMode;
  /** Currently selected/focused date */
  selectedDate?: Date;
  /** How to display appointment details */
  detailDisplay?: DetailDisplayMode;
  /** Callback when an appointment is clicked/selected */
  onSelectAppointment?: (appointment: Appointment) => void;
  /** Callback when an empty slot is clicked to create new appointment (legacy) */
  onCreateAppointment?: (startTime: Date, endTime: Date) => void;
  /** Callback when a new appointment is created with full data */
  onNewAppointment?: (appointmentData: NewAppointmentData) => void;
  /** Callback when an appointment is updated */
  onUpdateAppointment?: (appointment: Appointment) => void;
  /** Callback when an appointment is deleted */
  onDeleteAppointment?: (id: string) => void;
  /** Callback when an appointment is rescheduled via drag-and-drop */
  onRescheduleAppointment?: (id: string, newStartTime: Date) => void;
}

/**
 * Layout information for rendering an appointment block
 */
export interface AppointmentLayout {
  /** The appointment data */
  appointment: Appointment;
  /** Lane index for overlapping appointments (0-based) */
  lane: number;
  /** Total number of lanes in this overlap group */
  totalLanes: number;
  /** Calculated top position in pixels */
  top: number;
  /** Calculated height in pixels */
  height: number;
}

/**
 * Time slot for the grid
 */
export interface TimeSlot {
  /** The time for this slot */
  time: Date;
  /** Hour component (0-23) */
  hour: number;
  /** Minute component (0 or 30 for 30-min slots) */
  minute: number;
  /** Formatted display string (e.g., "9:00 AM") */
  label: string;
  /** Whether this is the start of an hour (for styling) */
  isHourStart: boolean;
}

/**
 * Context for drag-and-drop operations
 */
export interface DragContext {
  /** ID of the appointment being dragged */
  appointmentId: string | null;
  /** Original start time before drag */
  originalStartTime: Date | null;
  /** Preview time while dragging */
  previewTime: Date | null;
}
