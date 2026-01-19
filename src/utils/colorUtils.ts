import type { ServiceType } from '../types/scheduler';

/**
 * Color utility functions for the scheduler
 * Maps service types to consistent color schemes
 */

/**
 * Color configuration for each service type
 * Uses Tailwind CSS classes for consistent theming
 */
export interface ServiceColors {
  /** Background color class */
  bg: string;
  /** Border color class */
  border: string;
  /** Text color class */
  text: string;
  /** Hover background class */
  hoverBg: string;
  /** Badge/accent color for the service type indicator */
  badge: string;
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
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-900',
    hoverBg: 'hover:bg-rose-100',
    badge: 'bg-rose-400',
  },
  Hybrid: {
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-900',
    hoverBg: 'hover:bg-violet-100',
    badge: 'bg-violet-400',
  },
  Volume: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    hoverBg: 'hover:bg-amber-100',
    badge: 'bg-amber-400',
  },
  Refill: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    hoverBg: 'hover:bg-emerald-100',
    badge: 'bg-emerald-400',
  },
};

/**
 * Gets the color configuration for a service type
 * 
 * @param serviceType - The type of lash service
 * @returns ServiceColors object with Tailwind classes
 */
export function getServiceColors(serviceType: ServiceType): ServiceColors {
  return SERVICE_COLORS[serviceType];
}

/**
 * Gets a combined class string for an appointment block
 * 
 * @param serviceType - The type of lash service
 * @param isDragging - Whether the appointment is being dragged
 * @returns Combined Tailwind class string
 */
export function getAppointmentClasses(
  serviceType: ServiceType,
  isDragging: boolean = false
): string {
  const colors = getServiceColors(serviceType);
  
  const baseClasses = [
    colors.bg,
    colors.border,
    colors.text,
    'border-l-4',
    'rounded-r-lg',
    'shadow-sm',
    'transition-all',
    'duration-150',
  ];
  
  if (isDragging) {
    baseClasses.push('opacity-50', 'shadow-lg', 'scale-105');
  } else {
    baseClasses.push(colors.hoverBg, 'cursor-pointer');
  }
  
  return baseClasses.join(' ');
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
