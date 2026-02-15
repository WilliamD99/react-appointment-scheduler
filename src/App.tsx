import { useState, useCallback, useEffect } from 'react';
import { Scheduler, type Appointment, type DetailDisplayMode, type NewAppointmentData } from './components/Scheduler';
import { initializeTheme } from './utils/themeUtils';

/**
 * Demo Application
 * 
 * Demonstrates the Scheduler component with mock appointment data
 * for a lash studio appointment management system.
 */

// Generate mock appointments for the current week
function generateMockAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get start of week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const artists = ['Emma Wilson', 'Sofia Chen', 'Maya Rodriguez'];

    const appointments: Appointment[] = [
        // Today's appointments
        {
            id: '1',
            client: { name: 'Sarah Johnson', path: '/admin/collections/customers/1' },
            serviceType: 'Volume',
            artist: artists[0],
            startTime: createDate(today, 9, 0),
            duration: 150,
            phone: '(555) 123-4567',
            notes: 'First-time client. Prefers dramatic look.',
            email: 'sarah.johnson@example.com',
        },
        {
            id: '2',
            client: { name: 'Emily Chen', path: '/admin/collections/customers/2' },
            serviceType: 'Classic',
            artist: artists[1],
            startTime: createDate(today, 9, 30),
            duration: 90,
            phone: '(555) 234-5678',
            email: 'emily.chen@example.com',
        },
        {
            id: '3',
            client: { name: 'Rachel Green', path: '/admin/collections/customers/3' },
            serviceType: 'Hybrid',
            artist: artists[0],
            startTime: createDate(today, 12, 0),
            duration: 120,
            notes: 'Allergic to latex - use latex-free pads.',
            email: 'rachel.green@example.com',
        },
        {
            id: '4',
            client: { name: 'Monica Geller', path: '/admin/collections/customers/4' },
            serviceType: 'Refill',
            artist: artists[2],
            startTime: createDate(today, 14, 0),
            duration: 60,
            phone: '(555) 345-6789',
            email: 'monica.geller@example.com',
        },
        {
            id: '5',
            client: { name: 'Phoebe Buffay', path: '/admin/collections/customers/5' },
            serviceType: 'Volume',
            artist: artists[1],
            startTime: createDate(today, 15, 30),
            duration: 150,
            email: 'phoebe.buffay@example.com',
        },
        // Overlapping appointments to demonstrate layout
        {
            id: '6',
            client: { name: 'Jennifer Aniston', path: '/admin/collections/customers/6' },
            serviceType: 'Classic',
            artist: artists[2],
            startTime: createDate(today, 14, 30),
            duration: 90,
            notes: 'VIP client - offer complimentary champagne.',
            email: 'jennifer.aniston@example.com',
        },

        // Tomorrow's appointments
        {
            id: '7',
            client: { name: 'Lisa Kudrow', path: '/admin/collections/customers/7' },
            serviceType: 'Hybrid',
            artist: artists[0],
            startTime: createDate(addDays(today, 1), 10, 0),
            duration: 120,
            email: 'lisa.kudrow@example.com',
        },
        {
            id: '8',
            client: { name: 'Courteney Cox', path: '/admin/collections/customers/8' },
            serviceType: 'Refill',
            artist: artists[1],
            startTime: createDate(addDays(today, 1), 11, 0),
            duration: 60,
            phone: '(555) 456-7890',
            email: 'courteney.cox@example.com',
        },
        {
            id: '9',
            client: { name: 'Matt LeBlanc', path: '/admin/collections/customers/9' },
            serviceType: 'Classic',
            artist: artists[2],
            startTime: createDate(addDays(today, 1), 13, 30),
            duration: 90,
            notes: 'Male client - natural look preferred.',
            email: 'matt.leblanc@example.com',
        },
        {
            id: '10',
            client: { name: 'David Schwimmer', path: '/admin/collections/customers/10' },
            serviceType: 'Volume',
            artist: artists[0],
            startTime: createDate(addDays(today, 1), 16, 0),
            duration: 150,
            email: 'david.schwimmer@example.com',
        },

        // Day after tomorrow
        {
            id: '11',
            client: { name: 'Julia Roberts', path: '/admin/collections/customers/11' },
            serviceType: 'Volume',
            artist: artists[1],
            startTime: createDate(addDays(today, 2), 9, 0),
            duration: 150,
            phone: '(555) 567-8901',
            notes: 'Celebrity client - ensure privacy.',
            email: 'julia.roberts@example.com',
        },


        // Past appointments (earlier this week if today is not Sunday)
        ...(today.getDay() > 0
            ? [
                {
                    id: '14',
                    client: { name: 'Meryl Streep', path: '/admin/collections/customers/12' },
                    serviceType: 'Classic' as const,
                    artist: artists[1],
                    startTime: createDate(weekStart, 10, 0),
                    duration: 90,
                    email: 'meryl.streep@example.com',
                },
                {
                    id: '15',
                    client: { name: 'Nicole Kidman', path: '/admin/collections/customers/13' },
                    serviceType: 'Volume' as const,
                    artist: artists[0],
                    startTime: createDate(addDays(weekStart, 1), 13, 0),
                    duration: 150,
                    phone: '(555) 678-9012',
                    email: 'nicole.kidman@example.com',
                },
            ]
            : []),


    ];

    return appointments;
}

function createDate(baseDate: Date, hours: number, minutes: number): Date {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export default function App() {
    // Initialize theme on mount
    useEffect(() => {
        initializeTheme();
    }, []);

    // Define technicians and services
    const technicians = ['Emma Wilson', 'Sofia Chen', 'Maya Rodriguez'];
    const services = ['Classic', 'Hybrid', 'Volume', 'Refill'];

    // State for appointments (allows rescheduling demo)
    const [appointments, setAppointments] = useState<Appointment[]>(
        generateMockAppointments
    );

    // State for detail display mode toggle
    const [detailDisplay, setDetailDisplay] = useState<DetailDisplayMode>('modal');

    // Handle appointment selection
    const handleSelectAppointment = useCallback((appointment: Appointment) => {
        console.log('Selected appointment:', appointment);
    }, []);

    // Handle creating new appointment with full data from modal
    const handleNewAppointment = useCallback(
        (appointmentData: NewAppointmentData) => {
            console.log('Create appointment:', appointmentData);

            // Create new appointment with a unique ID
            const newAppointment: Appointment = {
                id: `new-${Date.now()}`,
                client: appointmentData.client,
                serviceType: appointmentData.serviceType,
                startTime: appointmentData.startTime,
                duration: appointmentData.duration,
                email: appointmentData.email,
                ...(appointmentData.artist && { artist: appointmentData.artist }),
                ...(appointmentData.phone && { phone: appointmentData.phone }),
                ...(appointmentData.notes && { notes: appointmentData.notes }),
            };

            setAppointments((prev) => [...prev, newAppointment]);
        },
        []
    );

    // Handle rescheduling appointment via drag-and-drop
    const handleRescheduleAppointment = useCallback(
        (id: string, newStartTime: Date) => {
            console.log('Reschedule appointment:', { id, newStartTime: newStartTime.toISOString() });

            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === id ? { ...apt, startTime: newStartTime } : apt
                )
            );
        },
        []
    );

    // Handle updating appointment from edit modal
    const handleUpdateAppointment = useCallback(
        (updatedAppointment: Appointment) => {
            console.log('Update appointment:', updatedAppointment);

            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === updatedAppointment.id ? updatedAppointment : apt
                )
            );
        },
        []
    );

    // Handle deleting appointment
    const handleDeleteAppointment = useCallback(
        (id: string) => {
            console.log('Delete appointment:', id);

            setAppointments((prev) => prev.filter((apt) => apt.id !== id));
        },
        []
    );

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="app-header-content">
                    <div>
                        <h1 className="app-title">Luxe Lash Studio</h1>
                        <p className="app-subtitle">Appointment Scheduler</p>
                    </div>

                    {/* Detail display toggle */}
                    <div className="app-header-controls">
                        <span className="app-header-label">Detail view:</span>
                        <select
                            value={detailDisplay}
                            onChange={(e) =>
                                setDetailDisplay(e.target.value as DetailDisplayMode)
                            }
                            className="form-select"
                            style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
                        >
                            <option value="modal">Modal</option>
                            <option value="panel">Side Panel</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="app-main">
                <div className="app-main-content">
                    {/* Scheduler container */}
                    <div className="scheduler-wrapper">
                        <Scheduler
                            appointments={appointments}
                            technicians={technicians.map((name) => ({ id: name, name }))}
                            services={services}
                            startHour={8}
                            endHour={21}
                            view="week"
                            detailDisplay={detailDisplay}
                            onSelectAppointment={handleSelectAppointment}
                            onNewAppointment={handleNewAppointment}
                            onUpdateAppointment={handleUpdateAppointment}
                            onDeleteAppointment={handleDeleteAppointment}
                            onRescheduleAppointment={handleRescheduleAppointment}
                        />
                    </div>

                    {/* Legend */}
                    <div className="app-legend">
                        <h2 className="legend-title">Service Types</h2>
                        <div className="legend-items">
                            <div className="legend-item">
                                <span className="legend-dot classic" />
                                <span className="legend-text">Classic (90 min)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot hybrid" />
                                <span className="legend-text">Hybrid (120 min)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot volume" />
                                <span className="legend-text">Volume (150 min)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot refill" />
                                <span className="legend-text">Refill (60 min)</span>
                            </div>
                        </div>
                        <p className="legend-tip">
                            Tip: Click an appointment to view details. Drag appointments to reschedule. Click an empty slot to create a new appointment.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
