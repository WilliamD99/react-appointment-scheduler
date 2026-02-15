import { useCallback, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { SchedulerProps, Appointment, ViewMode, NewAppointmentData, Technician, Service } from '../../types/scheduler';
import { formatShortDate, getWeekDates } from '../../utils/timeUtils';
import { getArtistId } from '../../utils/artistUtils';
import { useScheduler } from '../../hooks/useScheduler';
import { useDragDrop } from '../../hooks/useDragDrop';
import { getTechnicianColorForAppointment } from '../../utils/colorUtils';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { ViewToggle } from './ViewToggle';
import { ThemeToggle } from './ThemeToggle';
import { DetailModal } from './DetailModal';
import { DetailPanel } from './DetailPanel';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { DatePickerModal } from './DatePickerModal';

/**
 * Scheduler Component
 * 
 * The main scheduler component for a lash studio appointment management system.
 * 
 * Features:
 * - Day and Week view modes
 * - Time grid with 30-minute slots
 * - Color-coded appointments by service type
 * - Drag-and-drop rescheduling
 * - Configurable detail display (modal or side panel)
 * - Overlapping appointment handling
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <Scheduler
 *   appointments={myAppointments}
 *   startHour={8}
 *   endHour={21}
 *   view="week"
 *   detailDisplay="modal"
 *   onSelectAppointment={(apt) => console.log('Selected:', apt)}
 *   onCreateAppointment={(start, end) => console.log('Create:', start, end)}
 *   onRescheduleAppointment={(id, newTime) => console.log('Reschedule:', id, newTime)}
 * />
 * ```
 */
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function Scheduler({
    appointments,
    technicians: providedTechnicians,
    services,
    technicianServices,
    startHour = 8,
    endHour = 21,
    businessHours,
    view: initialView = 'week',
    selectedDate: initialDate,
    detailDisplay = 'modal',
    onSelectAppointment,
    onCreateAppointment,
    onNewAppointment,
    onUpdateAppointment,
    onDeleteAppointment,
    onRescheduleAppointment,
}: SchedulerProps) {
    // Per-day schedule: map day name -> { startHour, endHour } (parsed from businessHours)
    const scheduleByDay = useMemo(() => {
        if (!businessHours?.length) return null;
        const map = new Map<string, { startHour: number; endHour: number }>();
        for (const row of businessHours) {
            const day = row.day.toLowerCase();
            const start = parseInt(row.open, 10);
            const end = parseInt(row.close, 10);
            if (!Number.isNaN(start) && !Number.isNaN(end)) {
                map.set(day, { startHour: start, endHour: end });
            }
        }
        return map;
    }, [businessHours]);

    const getHoursForDate = useCallback(
        (date: Date): { startHour: number; endHour: number } => {
            if (!scheduleByDay) return { startHour, endHour };
            const dayName = DAY_NAMES[date.getDay()];
            const hours = scheduleByDay.get(dayName);
            return hours ?? { startHour, endHour };
        },
        [scheduleByDay, startHour, endHour]
    );

    // Normalize appointments: ensure startTime is Date (API often sends ISO strings).
    const appointmentsNormalized: Appointment[] = useMemo(() => {
        return appointments.map((apt) => ({
            ...apt,
            startTime: apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime as string),
        }));
    }, [appointments]);

    // Extract unique technicians from appointments if not provided.
    // Normalize: support both Technician[] and string[] (strings become { id, name }).
    // Support artist as string or { id, name }. Accept colorCode (from your app) as well as color.
    const technicians: Technician[] = useMemo(() => {
        if (providedTechnicians && providedTechnicians.length > 0) {
            return providedTechnicians.map((t): Technician => {
                if (typeof t === 'string') return { id: t, name: t };
                const raw = t as Technician & { colorCode?: string };
                return {
                    id: raw.id,
                    name: raw.name,
                    color: raw.color ?? raw.colorCode ?? undefined,
                };
            });
        }
        const byId = new Map<string, string>();
        appointments.forEach((apt) => {
            const id = getArtistId(apt.artist);
            if (id) {
                const name =
                    typeof apt.artist === 'object' && apt.artist != null
                        ? apt.artist.name ?? apt.artist.id
                        : id;
                if (!byId.has(id)) byId.set(id, name);
            }
        });
        return Array.from(byId.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([id, name]) => ({ id, name }));
    }, [providedTechnicians, appointments]);

    // Normalize services: support both Service[] and string[] (strings become { id, name, category }).
    // CreateAppointmentModal expects Service[] with id, name, category for the service selector.
    const normalizedServices: Service[] = useMemo(() => {
        if (!services?.length) return [];
        const first = services[0];
        if (typeof first === 'string') {
            return (services as string[]).map((s) => ({
                id: s,
                name: s,
                category: 'general',
            }));
        }
        return services as Service[];
    }, [services]);

    // Main scheduler state
    const {
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
    } = useScheduler({
        initialView,
        initialDate,
        detailDisplay,
    });

    // Effective hours for week view: union of all days' hours so the time column spans all openings
    const weekViewHours = useMemo(() => {
        if (!scheduleByDay) return { startHour, endHour };
        const days = getWeekDates(selectedDate);
        let minStart = 24;
        let maxEnd = 0;
        for (const d of days) {
            const { startHour: s, endHour: e } = getHoursForDate(d);
            minStart = Math.min(minStart, s);
            maxEnd = Math.max(maxEnd, e);
        }
        return { startHour: minStart, endHour: maxEnd };
    }, [scheduleByDay, selectedDate, getHoursForDate, startHour, endHour]);

    // Hours for the currently selected day (day view)
    const dayViewHours = useMemo(
        () => getHoursForDate(selectedDate),
        [getHoursForDate, selectedDate]
    );

    // Date picker modal state
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Selected date range (for week view highlighting)
    const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);

    // Drag and drop handling (use per-day hours when businessHours provided)
    const { draggingId, handleDragStart, handleDragEnd, snapModifier } = useDragDrop({
        startHour,
        endHour,
        getHoursForDate: scheduleByDay ? getHoursForDate : undefined,
        onReschedule: onRescheduleAppointment,
    });

    // Create appointment modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalStartTime, setCreateModalStartTime] = useState<Date | null>(null);
    const [createModalEndTime, setCreateModalEndTime] = useState<Date | null>(null);
    const [createModalTechnicianId, setCreateModalTechnicianId] = useState<string | null>(null);

    // Configure pointer sensor with activation constraint
    // Prevents accidental drags from clicks
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        })
    );

    // Handle appointment click - combines internal state and external callback
    const handleAppointmentClick = useCallback(
        (appointment: Appointment) => {
            selectAppointment(appointment);
            if (onSelectAppointment) {
                onSelectAppointment(appointment);
            }
        },
        [selectAppointment, onSelectAppointment]
    );

    // Handle slot click - opens create modal with pre-filled time and technician
    const handleSlotClick = useCallback(
        (startTime: Date, endTime: Date, technicianId?: string) => {
            setCreateModalStartTime(startTime);
            setCreateModalEndTime(endTime);
            setCreateModalTechnicianId(technicianId || null);
            setIsCreateModalOpen(true);
        },
        []
    );

    // Handle Create New button click
    const handleCreateNewClick = useCallback(() => {
        setCreateModalStartTime(null);
        setCreateModalEndTime(null);
        setCreateModalTechnicianId(null);
        setIsCreateModalOpen(true);
    }, []);

    // Handle appointment creation from modal
    const handleCreateAppointment = useCallback(
        (appointmentData: NewAppointmentData) => {
            // Call the new callback with full data if provided
            // Includes: clientName, serviceType, startTime, duration, email, artist, phone, notes
            if (onNewAppointment) {
                console.log(appointmentData)
                onNewAppointment(appointmentData);
            }
            // Also call legacy callback for backward compatibility
            if (onCreateAppointment) {
                const endTime = new Date(appointmentData.startTime);
                onCreateAppointment(appointmentData.startTime, endTime);
            }
        },
        [onNewAppointment, onCreateAppointment]
    );

    // Close create modal
    const handleCloseCreateModal = useCallback(() => {
        setIsCreateModalOpen(false);
        setCreateModalStartTime(null);
        setCreateModalEndTime(null);
        setCreateModalTechnicianId(null);
    }, []);

    // Handle view change
    const handleViewChange = useCallback(
        (newView: ViewMode) => {
            setView(newView);
        },
        [setView]
    );

    // Handle navigation label click - opens date picker
    const handleNavigationLabelClick = useCallback(() => {
        setIsDatePickerOpen(true);
    }, []);

    // Handle single date selection (day view)
    const handleDateSelect = useCallback(
        (date: Date) => {
            setSelectedDate(date);
        },
        [setSelectedDate]
    );

    // Handle date range selection (week view)
    const handleDateRangeSelect = useCallback(
        (startDate: Date, endDate: Date) => {
            // Set the selected date to the start of the range
            // The week view will display from this date
            setSelectedDate(startDate);
            // Store the selected range for highlighting
            setSelectedDateRange({ start: startDate, end: endDate });
        },
        [setSelectedDate]
    );

    // Find the appointment being dragged for the overlay
    const draggingAppointment = useMemo(
        () => appointmentsNormalized.find((apt) => apt.id === draggingId),
        [appointmentsNormalized, draggingId]
    );

    // Get navigation label based on view
    const navigationLabel = useMemo(() => {
        if (view === 'day') {
            return formatShortDate(selectedDate);
        } else {
            // Show week range
            const weekStart = new Date(selectedDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
        }
    }, [view, selectedDate]);

    // Suppress unused variable warning
    void goToToday;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[snapModifier]}
        >
            <div className="scheduler-container">
                {/* Header with navigation and controls */}
                <header className="scheduler-header">
                    {/* Navigation */}
                    <div className="scheduler-nav">
                        <button
                            type="button"
                            onClick={goToPrevious}
                            className="scheduler-nav-btn"
                            aria-label={view === 'day' ? 'Previous day' : 'Previous week'}
                        >
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleNavigationLabelClick}
                            className="scheduler-nav-label"
                            aria-label="Select date"
                        >
                            {navigationLabel}
                        </button>
                        <button
                            type="button"
                            onClick={goToNext}
                            className="scheduler-nav-btn"
                            aria-label={view === 'day' ? 'Next day' : 'Next week'}
                        >
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Theme toggle, View toggle and Create button */}
                    <div className="scheduler-controls">
                        <ThemeToggle />
                        <ViewToggle view={view} onViewChange={handleViewChange} />
                        <button
                            type="button"
                            onClick={handleCreateNewClick}
                            className="scheduler-create-btn"
                        >
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Create New
                        </button>
                    </div>
                </header>

                {/* Main content area */}
                <div className="scheduler-content">
                    {view === 'day' ? (
                        <DayView
                            date={selectedDate}
                            appointments={appointmentsNormalized}
                            technicians={technicians}
                            startHour={dayViewHours.startHour}
                            endHour={dayViewHours.endHour}
                            onAppointmentClick={handleAppointmentClick}
                            onSlotClick={handleSlotClick}
                            selectedAppointmentId={selectedAppointment?.id}
                            draggingAppointmentId={draggingId}
                        />
                    ) : (
                        <WeekView
                            selectedDate={selectedDate}
                            appointments={appointmentsNormalized}
                            startHour={weekViewHours.startHour}
                            endHour={weekViewHours.endHour}
                            getHoursForDate={scheduleByDay ? getHoursForDate : undefined}
                            onAppointmentClick={handleAppointmentClick}
                            onSlotClick={handleSlotClick}
                            selectedAppointmentId={selectedAppointment?.id}
                            draggingAppointmentId={draggingId}
                            selectedDateRange={selectedDateRange}
                            technicians={technicians}
                        />
                    )}
                </div>

                {/* Drag overlay - shows the dragged appointment */}
                <DragOverlay>
                    {draggingAppointment && (
                        <div
                            className="drag-overlay technician-color"
                            style={{
                                width: '150px',
                                ['--block-color' as string]: getTechnicianColorForAppointment(draggingAppointment, technicians),
                            }}
                        >
                            <p className="drag-overlay-client">
                                {draggingAppointment.client.name}
                            </p>
                            <p className="drag-overlay-service">
                                {draggingAppointment.serviceType}
                            </p>
                        </div>
                    )}
                </DragOverlay>

                {/* Detail display - Modal or Panel based on prop */}
                {detailDisplay === 'modal' ? (
                    <DetailModal
                        appointment={selectedAppointment}
                        isOpen={isDetailOpen}
                        onClose={closeDetail}
                        onUpdate={onUpdateAppointment}
                        onDelete={onDeleteAppointment}
                        services={normalizedServices}
                        technicians={technicians}
                    />
                ) : (
                    <DetailPanel
                        appointment={selectedAppointment}
                        isOpen={isDetailOpen}
                        onClose={closeDetail}
                        onUpdate={onUpdateAppointment}
                        onDelete={onDeleteAppointment}
                        services={normalizedServices}
                        technicians={technicians}
                    />
                )}

                {/* Create appointment modal */}
                <CreateAppointmentModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onCreate={handleCreateAppointment}
                    initialStartTime={createModalStartTime}
                    initialEndTime={createModalEndTime}
                    initialTechnicianId={createModalTechnicianId}
                    technicians={technicians}
                    services={normalizedServices}
                    technicianServices={technicianServices}
                />

                {/* Date picker modal */}
                <DatePickerModal
                    isOpen={isDatePickerOpen}
                    onClose={() => setIsDatePickerOpen(false)}
                    mode={view === 'day' ? 'single' : 'range'}
                    initialDate={selectedDate}
                    initialEndDate={view === 'week' ? (() => {
                        const weekEnd = new Date(selectedDate);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        return weekEnd;
                    })() : undefined}
                    maxRangeDays={7}
                    onSelectDate={handleDateSelect}
                    onSelectRange={handleDateRangeSelect}
                />
            </div>
        </DndContext>
    );
}

export default Scheduler;
