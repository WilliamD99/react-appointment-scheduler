import { useCallback, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { SchedulerProps, Appointment, ViewMode, NewAppointmentData } from '../../types/scheduler';
import { useScheduler } from '../../hooks/useScheduler';
import { useDragDrop } from '../../hooks/useDragDrop';
import { formatShortDate } from '../../utils/timeUtils';
import { getServiceColors } from '../../utils/colorUtils';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { ViewToggle } from './ViewToggle';
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
export function Scheduler({
    appointments,
    technicians: providedTechnicians,
    startHour = 8,
    endHour = 21,
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
    // Extract unique technicians from appointments if not provided
    const technicians = useMemo(() => {
        if (providedTechnicians && providedTechnicians.length > 0) {
            return providedTechnicians;
        }
        // Extract unique artist names from appointments
        const artistSet = new Set<string>();
        appointments.forEach((apt) => {
            if (apt.artist) {
                artistSet.add(apt.artist);
            }
        });
        return Array.from(artistSet).sort();
    }, [providedTechnicians, appointments]);
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

    // Date picker modal state
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Drag and drop handling
    const { draggingId, handleDragStart, handleDragEnd, snapModifier } = useDragDrop({
        startHour,
        endHour,
        onReschedule: onRescheduleAppointment,
    });

    // Create appointment modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalStartTime, setCreateModalStartTime] = useState<Date | null>(null);
    const [createModalEndTime, setCreateModalEndTime] = useState<Date | null>(null);

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

    // Handle slot click - opens create modal with pre-filled time
    const handleSlotClick = useCallback(
        (startTime: Date, endTime: Date) => {
            setCreateModalStartTime(startTime);
            setCreateModalEndTime(endTime);
            setIsCreateModalOpen(true);
        },
        []
    );

    // Handle Create New button click
    const handleCreateNewClick = useCallback(() => {
        setCreateModalStartTime(null);
        setCreateModalEndTime(null);
        setIsCreateModalOpen(true);
    }, []);

    // Handle appointment creation from modal
    const handleCreateAppointment = useCallback(
        (appointmentData: NewAppointmentData) => {
            // Call the new callback with full data if provided
            if (onNewAppointment) {
                onNewAppointment(appointmentData);
            }
            // Also call legacy callback for backward compatibility
            if (onCreateAppointment) {
                const endTime = new Date(appointmentData.startTime);
                endTime.setMinutes(endTime.getMinutes() + appointmentData.duration);
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
        (startDate: Date) => {
            // Set the selected date to the start of the range
            // The week view will display from this date
            setSelectedDate(startDate);
        },
        [setSelectedDate]
    );

    // Find the appointment being dragged for the overlay
    const draggingAppointment = useMemo(
        () => appointments.find((apt) => apt.id === draggingId),
        [appointments, draggingId]
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

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[snapModifier]}
        >
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                {/* Header with navigation and controls */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goToPrevious}
                            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                            aria-label={view === 'day' ? 'Previous day' : 'Previous week'}
                        >
                            <svg
                                className="w-5 h-5"
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
                            className="min-w-[140px] px-3 py-1.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            aria-label="Select date"
                        >
                            {navigationLabel}
                        </button>
                        <button
                            type="button"
                            onClick={goToNext}
                            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                            aria-label={view === 'day' ? 'Next day' : 'Next week'}
                        >
                            <svg
                                className="w-5 h-5"
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

                    {/* View toggle and Create button */}
                    <div className="flex items-center gap-3">
                        <ViewToggle view={view} onViewChange={handleViewChange} />
                        <button
                            type="button"
                            onClick={handleCreateNewClick}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                        >
                            <svg
                                className="w-4 h-4"
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
                <div className="flex-1 overflow-hidden relative">
                    {view === 'day' ? (
                        <DayView
                            date={selectedDate}
                            appointments={appointments}
                            technicians={technicians}
                            startHour={startHour}
                            endHour={endHour}
                            onAppointmentClick={handleAppointmentClick}
                            onSlotClick={handleSlotClick}
                            selectedAppointmentId={selectedAppointment?.id}
                            draggingAppointmentId={draggingId}
                        />
                    ) : (
                        <WeekView
                            selectedDate={selectedDate}
                            appointments={appointments}
                            startHour={startHour}
                            endHour={endHour}
                            onAppointmentClick={handleAppointmentClick}
                            onSlotClick={handleSlotClick}
                            selectedAppointmentId={selectedAppointment?.id}
                            draggingAppointmentId={draggingId}
                        />
                    )}
                </div>

                {/* Drag overlay - shows the dragged appointment */}
                <DragOverlay>
                    {draggingAppointment && (
                        <div
                            className={`
                px-3 py-2 rounded-lg shadow-xl border-l-4
                ${getServiceColors(draggingAppointment.serviceType).bg}
                ${getServiceColors(draggingAppointment.serviceType).border}
                ${getServiceColors(draggingAppointment.serviceType).text}
                opacity-90
              `}
                            style={{ width: '150px' }}
                        >
                            <p className="font-semibold text-sm truncate">
                                {draggingAppointment.clientName}
                            </p>
                            <p className="text-xs opacity-75">
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
                    />
                ) : (
                    <DetailPanel
                        appointment={selectedAppointment}
                        isOpen={isDetailOpen}
                        onClose={closeDetail}
                        onUpdate={onUpdateAppointment}
                        onDelete={onDeleteAppointment}
                    />
                )}

                {/* Create appointment modal */}
                <CreateAppointmentModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onCreate={handleCreateAppointment}
                    initialStartTime={createModalStartTime}
                    initialEndTime={createModalEndTime}
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
