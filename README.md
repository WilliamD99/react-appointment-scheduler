# react-appointment-scheduler

A production-ready React scheduler component for appointment management. Features day/week views, drag-and-drop rescheduling, create-appointment modal with **multiple jobs per appointment** (service + technician per job), and a minimal, themeable UI.

## Features

- **Day & Week Views** - Toggle between single day and full week layouts
- **Drag & Drop** - Reschedule appointments by dragging to new times or days
- **Create Appointment** - Modal to add appointments with multiple jobs (each job = one service + optional technician)
- **Overlap Handling** - Automatically stacks overlapping appointments
- **Detail Views** - Modal or side panel for appointment details
- **Responsive** - Desktop-first with mobile support
- **TypeScript** - Full type definitions included
- **Accessible** - Keyboard navigation and ARIA labels
- **Theming** - CSS variables and built-in light/dark mode

## Installation

```bash
npm install react-appointment-scheduler
```

### Peer Dependencies

This package requires React 18+ or 19+:

```bash
npm install react react-dom
```

### Styles

Import the component styles **once** in your app (e.g. root layout or main entry):

```tsx
import 'react-appointment-scheduler/styles.css';
```

The scheduler needs a **defined height** (e.g. `height: 600px` or `min-height: 70vh`).

## Quick start

```tsx
import { Scheduler } from 'react-appointment-scheduler';
import type { Appointment, Service, Technician } from 'react-appointment-scheduler';
import 'react-appointment-scheduler/styles.css';

const appointments: Appointment[] = [
  {
    id: '1',
    client: { name: 'Sarah Johnson', path: '' },
    serviceType: 'classic-lashes',
    artist: 'tech-1',
    startTime: new Date('2025-02-17T09:00:00'),
    duration: 60,
    email: 'sarah@example.com',
  },
];

const services: Service[] = [
  { id: 'classic-lashes', name: 'Classic Lashes', category: 'Lashes', duration: 60 },
  { id: 'quick-touchup', name: 'Quick Touch-up', category: 'Lashes', duration: 30 },
];

const technicians: Technician[] = [
  { id: 'tech-1', name: 'Emma Wilson', color: '#fb7185' },
  { id: 'tech-2', name: 'Alex Chen', color: '#a78bfa' },
];

function App() {
  return (
    <div style={{ height: '600px' }}>
      <Scheduler
        appointments={appointments}
        services={services}
        technicians={technicians}
        technicianServices={{ 'tech-1': ['classic-lashes', 'quick-touchup'], 'tech-2': ['classic-lashes'] }}
        startHour={8}
        endHour={21}
        view="week"
        detailDisplay="modal"
        onSelectAppointment={(apt) => console.log('Selected:', apt)}
        onNewAppointment={(data) => console.log('Create:', data)}
        onRescheduleAppointment={(id, newTime) => console.log('Reschedule:', id, newTime)}
      />
    </div>
  );
}
```

## Documentation for your project

**→ [USAGE.md](./USAGE.md)** – Integration guide for using this package in another app. It includes:

- **Data model** – `Appointment`, `Service`, `Technician`, `Job`, `NewAppointmentData`, `Client`, `TechnicianServices`
- **Styling** – Importing CSS, CSS variables, dark mode
- **Create appointment flow** – Multiple jobs per appointment, handling `onNewAppointment` and persisting `jobs`
- **Props reference** – All Scheduler props and callbacks
- **TypeScript** – Exported types
- **Checklist** – Steps to wire the scheduler into your backend

## API overview

### Main props

| Prop | Type | Description |
|------|------|-------------|
| `appointments` | `Appointment[]` | Appointments to display |
| `services` | `Service[]` or `string[]` | Bookable services (with `duration` for correct times) |
| `technicians` | `Technician[]` | Staff; optional, used in Create modal and block colors |
| `technicianServices` | `Record<string, string[]>` | Map tech ID → service IDs; filters technician dropdown by service |
| `startHour` / `endHour` | `number` | Grid hours (default 8–21) |
| `view` | `'day' \| 'week'` | View mode |
| `detailDisplay` | `'modal' \| 'panel'` | How details are shown |
| `onNewAppointment` | `(data: NewAppointmentData) => void` | Called when user creates an appointment (includes `jobs[]`) |
| `onSelectAppointment` | `(apt: Appointment) => void` | Click on appointment |
| `onUpdateAppointment` | `(apt: Appointment) => void` | User saved edits (includes updated `jobs` when present) |
| `onDeleteAppointment` | `(id: string) => void` | User deleted |
| `onRescheduleAppointment` | `(id: string, newStart: Date) => void` | After drag-and-drop |

### Data shapes (summary)

- **Appointment**: `id`, `client: { name, path }`, `jobs?`, `serviceType`, `artist?`, `startTime`, `duration`, `email`, `phone?`, `notes?`
- **NewAppointmentData** (from Create modal): `client`, `jobs: { serviceType, technicianId? }[]`, `startTime`, `duration`, `email`, `phone?`, `notes?`
- **Service**: `id`, `name`, `category` (string or `{ id, name }`), `duration?` (minutes)
- **Technician**: `id`, `name`, `color?`

## Advanced usage

### SSR (Next.js, Remix, etc.)

Use the scheduler in a client component and import the styles once:

```tsx
'use client';

import { Scheduler } from 'react-appointment-scheduler';
import 'react-appointment-scheduler/styles.css';

export default function SchedulerPage() {
  return (
    <div style={{ height: '600px' }}>
      <Scheduler appointments={appointments} services={services} />
    </div>
  );
}
```

### Theme (light/dark)

Set `data-theme="dark"` on the document root for dark mode. You can use the package helpers:

```tsx
import { ThemeToggle, initializeTheme } from 'react-appointment-scheduler';
import { useEffect } from 'react';

useEffect(() => { initializeTheme(); }, []);
// Then render <ThemeToggle /> and <Scheduler {...props} />
```

See [THEME_DOCS.md](./THEME_DOCS.md) for details.

### Custom styling

Override CSS variables in your app (all prefixed with `--scheduler-*`):

```css
:root {
  --scheduler-bg-primary: #ffffff;
  --scheduler-text-primary: #1c1917;
  --scheduler-border-primary: #e7e5e4;
  --scheduler-slot-height: 60px;
}
```

Full list and dark-mode variables are in [USAGE.md](./USAGE.md#theming-and-css-variables).

### Sub-components and utilities

```tsx
import {
  DayView,
  WeekView,
  TimeGrid,
  AppointmentBlock,
  CreateAppointmentModal,
  useScheduler,
  useDragDrop,
  formatTime,
  formatFullDate,
} from 'react-appointment-scheduler';
```

## TypeScript

Types are exported for use in your app:

```tsx
import type {
  Appointment,
  NewAppointmentData,
  Job,
  Service,
  Technician,
  TechnicianServices,
  Client,
  SchedulerProps,
  ViewMode,
  DetailDisplayMode,
} from 'react-appointment-scheduler';
```

## License

MIT
