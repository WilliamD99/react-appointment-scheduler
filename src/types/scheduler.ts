/**
 * Core types for the Lash Studio Scheduler component
 */

/** Available lash service types (stores service ID) */
export type ServiceType = string;

/**
 * Represents a service that can be booked.
 * 
 * @example
 * ```ts
 * const services: Service[] = [
 *   { id: '1', name: 'Classic Lashes', category: 'lashes' },
 *   { id: '2', name: 'Regular Pedicure', category: 'nails' },
 *   { id: '3', name: 'Volume Lashes', category: 'lashes' },
 * ];
 * ```
 */
export interface Service {
  /** Unique identifier for the service */
  id: string;
  /** Display name of the service */
  name: string;
  /** Category for grouping services (e.g., 'lashes', 'nails', 'facial') */
  category: string;
  /** Optional duration in minutes for this service */
  duration?: number;
}

/**
 * Represents a technician/artist who can perform services.
 * 
 * @example
 * ```ts
 * const technicians: Technician[] = [
 *   { id: 'tech-1', name: 'Sarah Wilson' },
 *   { id: 'tech-2', name: 'Emily Chen' },
 *   { id: 'tech-3', name: 'Jessica Rodriguez' },
 * ];
 * ```
 */
export interface Technician {
  /** Unique identifier for the technician */
  id: string;
  /** Display name of the technician */
  name: string;
  /** Optional color (e.g. hex #rrggbb) for this technician; used for blocks and UI. If omitted, a default is used. */
  color?: string;
}

/**
 * Map of technician IDs to the service IDs they can perform.
 * This allows parent applications to define which technicians are qualified
 * for which services.
 * 
 * @example
 * ```ts
 * const technicianServices: TechnicianServices = {
 *   'tech-1': ['1', '2', '3'],  // Technician tech-1 can do services with these IDs
 *   'tech-2': ['1', '4'],       // Technician tech-2 can only do services 1 and 4
 *   'tech-3': ['3', '5'],       // Technician tech-3 specializes in services 3 and 5
 * };
 * ```
 */
export type TechnicianServices = Record<string, string[]>;

/**
 * Open/close hours for a single day of the week.
 * Used when business hours differ by day (e.g. Mon–Fri 10–19, Sat–Sun 11–18).
 *
 * @example
 * ```ts
 * const businessHours: DaySchedule[] = [
 *   { day: 'monday', open: '10', close: '19' },
 *   { day: 'saturday', open: '11', close: '18' },
 * ];
 * ```
 */
export interface DaySchedule {
  /** Day name in lowercase: 'sunday' | 'monday' | ... | 'saturday' */
  day: string;
  /** Opening hour (0–23) as string, e.g. '10' for 10:00 */
  open: string;
  /** Closing hour (0–23) as string, e.g. '19' for 19:00 */
  close: string;
}

/** View modes for the scheduler */
export type ViewMode = 'day' | 'week';

/** Detail display modes */
export type DetailDisplayMode = 'modal' | 'panel';

/** Artist can be a string id or an object with id and optional name (e.g. from APIs) */
export type Artist = string | { id: string; name?: string };

export type Client = { name: string; path: string }
/**
 * Represents a single appointment in the scheduler
 */
export interface Appointment {
  /** Unique identifier for the appointment */
  id: string;
  /** Name of the client */
  client: Client;
  /** Type of lash service being performed */
  serviceType: ServiceType;
  /** Lash artist: string id or object { id, name } (objects supported when data comes from APIs) */
  artist?: Artist;
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
  client: Client;
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
  /** List of technicians/artists with id and name */
  technicians?: Technician[];
  /** List of available services (Service[] or string[]; strings are normalized to { id, name, category: 'general' }) */
  services: Service[] | string[];
  /** 
   * Map of technician IDs to service IDs they can perform.
   * When provided, the Create Appointment modal will filter available
   * services based on the selected technician.
   * If a technician is not in the map, all services will be shown.
   */
  technicianServices?: TechnicianServices;
  /** Starting hour of the work day (default: 8 for 8 AM). Ignored when businessHours is provided. */
  startHour?: number;
  /** Ending hour of the work day (default: 21 for 9 PM). Ignored when businessHours is provided. */
  endHour?: number;
  /**
   * Per-day open/close hours. When provided (non-null, non-undefined, non-empty), the grid
   * and slots use these hours per day instead of a single startHour/endHour.
   * When null, undefined, or an empty array, the whole day uses startHour/endHour.
   * Day names must be lowercase ('monday' … 'sunday').
   */
  businessHours?: DaySchedule[] | null;
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
  /** Resolved color for this block (from technician or default) */
  color?: string;
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
