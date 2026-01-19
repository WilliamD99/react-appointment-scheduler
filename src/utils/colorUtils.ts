import type { ServiceType } from '../types/scheduler';

/**
 * Color utility functions for the scheduler
 * Maps service types to consistent color schemes
 */

/**
 * Color configuration for each service type
 * Uses CSS class names for consistent theming
 */
export interface ServiceColors {
  /** CSS class name for the service type */
  className: string;
  /** Badge background color (CSS variable) */
  badgeColor: string;
}

/**
 * Color mappings for lash service types
 * 
 * - Classic: Rose/Pink - Soft and elegant
 * - Hybrid: Lavender/Violet - Modern and versatile
 * - Volume: Peach/Amber - Warm and dramatic
 * - Refill: Sage/Emerald - Fresh and natural
 */
export const SERVICE_COLORS: Record<ServiceType, ServiceColors> = {
  Classic: {
    className: 'service-classic',
    badgeColor: 'var(--color-rose-400)',
  },
  Hybrid: {
    className: 'service-hybrid',
    badgeColor: 'var(--color-violet-400)',
  },
  Volume: {
    className: 'service-volume',
    badgeColor: 'var(--color-amber-400)',
  },
  Refill: {
    className: 'service-refill',
    badgeColor: 'var(--color-emerald-400)',
  },
};

/**
 * Gets the color configuration for a service type
 * 
 * @param serviceType - The type of lash service
 * @returns ServiceColors object with CSS class names
 */
export function getServiceColors(serviceType: ServiceType): ServiceColors {
  return SERVICE_COLORS[serviceType];
}

/**
 * Gets a combined class string for an appointment block
 * 
 * @param serviceType - The type of lash service
 * @param isDragging - Whether the appointment is being dragged
 * @returns Combined CSS class string
 */
export function getAppointmentClasses(
  serviceType: ServiceType,
  isDragging: boolean = false
): string {
  const colors = getServiceColors(serviceType);
  
  const classes = ['appointment-block', colors.className];
  
  if (isDragging) {
    classes.push('dragging');
  }
  
  return classes.join(' ');
}

/**
 * Gets the display name for a service type with emoji
 * 
 * @param serviceType - The type of lash service
 * @returns Formatted service name
 */
export function getServiceDisplayName(serviceType: ServiceType): string {
  const names: Record<ServiceType, string> = {
    Classic: 'Classic Lashes',
    Hybrid: 'Hybrid Set',
    Volume: 'Volume Lashes',
    Refill: 'Lash Refill',
  };
  
  return names[serviceType];
}

/**
 * Gets estimated duration for a service type (default values)
 * Used for reference when creating new appointments
 */
export function getDefaultDuration(serviceType: ServiceType): number {
  const durations: Record<ServiceType, number> = {
    Classic: 90,
    Hybrid: 120,
    Volume: 150,
    Refill: 60,
  };
  
  return durations[serviceType];
}
