import { useState, useCallback, useMemo } from 'react';
import type { Appointment, ViewMode, DetailDisplayMode } from '../types/scheduler';
import { getToday } from '../utils/timeUtils';

/**
 * Main state management hook for the Scheduler component
 * 
 * Manages:
 * - Current view mode (day/week)
 * - Selected date
 * - Selected appointment
 * - Detail panel/modal visibility
 */

interface UseSchedulerOptions {
  /** Initial view mode */
  initialView?: ViewMode;
  /** Initial selected date */
  initialDate?: Date;
  /** Detail display mode */
  detailDisplay?: DetailDisplayMode;
}

interface UseSchedulerReturn {
  /** Current view mode */
  view: ViewMode;
  /** Change the view mode */
  setView: (view: ViewMode) => void;
  /** Currently selected date */
  selectedDate: Date;
  /** Change the selected date */
  setSelectedDate: (date: Date) => void;
  /** Navigate to previous day/week */
  goToPrevious: () => void;
  /** Navigate to next day/week */
  goToNext: () => void;
  /** Navigate to today */
  goToToday: () => void;
  /** Currently selected appointment */
  selectedAppointment: Appointment | null;
  /** Select an appointment (opens detail view) */
  selectAppointment: (appointment: Appointment | null) => void;
  /** Whether the detail view is open */
  isDetailOpen: boolean;
  /** Close the detail view */
  closeDetail: () => void;
  /** How to display the detail */
  detailDisplay: DetailDisplayMode;
}

export function useScheduler({
  initialView = 'week',
  initialDate,
  detailDisplay = 'modal',
}: UseSchedulerOptions = {}): UseSchedulerReturn {
  const [view, setView] = useState<ViewMode>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ?? getToday()
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  /**
   * Navigate to the previous day or week depending on current view
   */
  const goToPrevious = useCallback(() => {
    setSelectedDate((current) => {
      const newDate = new Date(current);
      if (view === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
      return newDate;
    });
  }, [view]);

  /**
   * Navigate to the next day or week depending on current view
   */
  const goToNext = useCallback(() => {
    setSelectedDate((current) => {
      const newDate = new Date(current);
      if (view === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  }, [view]);

  /**
   * Navigate to today's date
   */
  const goToToday = useCallback(() => {
    setSelectedDate(getToday());
  }, []);

  /**
   * Select an appointment to view details
   */
  const selectAppointment = useCallback((appointment: Appointment | null) => {
    setSelectedAppointment(appointment);
  }, []);

  /**
   * Close the detail view
   */
  const closeDetail = useCallback(() => {
    setSelectedAppointment(null);
  }, []);

  /**
   * Whether the detail view is open
   */
  const isDetailOpen = useMemo(
    () => selectedAppointment !== null,
    [selectedAppointment]
  );

  return {
    view,
    setView,
    selectedDate,
    setSelectedDate,
    goToPrevious,
    goToNext,
    goToToday,
    selectedAppointment,
    selectAppointment,
    isDetailOpen,
    closeDetail,
    detailDisplay,
  };
}

export default useScheduler;
