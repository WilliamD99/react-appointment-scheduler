# react-appointment-scheduler

A production-ready React scheduler component for appointment management. Features day/week views, drag-and-drop rescheduling, color-coded appointment types, and a beautiful, minimal UI.

## Features

- **Day & Week Views** - Toggle between single day and full week layouts
- **Drag & Drop** - Reschedule appointments by dragging to new times or days
- **Color-Coded Types** - 4 customizable service types with distinct colors
- **Overlap Handling** - Automatically stacks overlapping appointments
- **Detail Views** - Modal or side panel for appointment details
- **Responsive** - Desktop-first with mobile support
- **TypeScript** - Full type definitions included
- **Accessible** - Keyboard navigation and ARIA labels

## Installation

```bash
npm install react-appointment-scheduler
```

### Peer Dependencies

This package requires React 18+ or 19+:

```bash
npm install react react-dom
```

### Tailwind CSS Setup

This component uses Tailwind CSS. Add the package to your Tailwind content configuration:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/react-appointment-scheduler/dist/**/*.{js,mjs}',
  ],
  // ...
}
```

## Usage

### Basic Example

```tsx
import { Scheduler, type Appointment } from 'react-appointment-scheduler';

const appointments: Appointment[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    serviceType: 'Volume',
    artist: 'Emma Wilson',
    startTime: new Date('2024-01-15T09:00:00'),
    duration: 150,
    phone: '(555) 123-4567',
    notes: 'First-time client',
  },
  {
    id: '2',
    clientName: 'Emily Chen',
    serviceType: 'Classic',
    startTime: new Date('2024-01-15T14:00:00'),
    duration: 90,
  },
];

function App() {
  return (
    <div className="h-[600px]">
      <Scheduler
        appointments={appointments}
        startHour={8}
        endHour={21}
        view="week"
        detailDisplay="modal"
        onSelectAppointment={(apt) => console.log('Selected:', apt)}
        onCreateAppointment={(start, end) => console.log('Create:', start, end)}
        onRescheduleAppointment={(id, newTime) => console.log('Reschedule:', id, newTime)}
      />
    </div>
  );
}
```

## API Reference

### `<Scheduler />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appointments` | `Appointment[]` | required | Array of appointments to display |
| `startHour` | `number` | `8` | Working hours start (0-23) |
| `endHour` | `number` | `21` | Working hours end (0-23) |
| `view` | `'day' \| 'week'` | `'week'` | Initial view mode |
| `selectedDate` | `Date` | today | Initially selected/focused date |
| `detailDisplay` | `'modal' \| 'panel'` | `'modal'` | How to show appointment details |
| `onSelectAppointment` | `(apt: Appointment) => void` | - | Called when clicking an appointment |
| `onCreateAppointment` | `(start: Date, end: Date) => void` | - | Called when clicking an empty slot |
| `onRescheduleAppointment` | `(id: string, newStart: Date) => void` | - | Called after drag-and-drop |

### `Appointment` Type

```typescript
interface Appointment {
  id: string;
  clientName: string;
  serviceType: 'Classic' | 'Hybrid' | 'Volume' | 'Refill';
  artist?: string;
  startTime: Date;
  duration: number; // minutes
  notes?: string;
  phone?: string;
}
```

### Service Types & Colors

| Type | Color | Use Case Example |
|------|-------|------------------|
| Classic | Rose/Pink | Standard service |
| Hybrid | Lavender/Violet | Mixed/combination service |
| Volume | Peach/Amber | Premium/extended service |
| Refill | Sage/Emerald | Maintenance/follow-up |

## Advanced Usage

### Custom Styling

The component uses Tailwind CSS classes. You can customize colors by overriding the service color utilities:

```tsx
import { getServiceColors, type ServiceType } from 'react-appointment-scheduler';

// Get colors for a service type
const colors = getServiceColors('Volume');
// { bg: 'bg-amber-50', border: 'border-amber-300', ... }
```

### Using Individual Components

You can import and use sub-components for custom layouts:

```tsx
import {
  DayView,
  WeekView,
  TimeGrid,
  AppointmentBlock,
  useScheduler,
  useDragDrop,
} from 'react-appointment-scheduler';
```

### Utility Functions

```tsx
import {
  formatTime,
  formatFullDate,
  calculateAppointmentLayouts,
  filterAppointmentsByDay,
} from 'react-appointment-scheduler';

// Format time: "9:00 AM"
formatTime(new Date());

// Format date: "Monday, January 15, 2024"
formatFullDate(new Date());
```

## Styling

The component container should have a defined height:

```tsx
<div className="h-[600px]">
  <Scheduler appointments={appointments} />
</div>
```

Or use viewport height:

```tsx
<div className="h-[calc(100vh-200px)]">
  <Scheduler appointments={appointments} />
</div>
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  Appointment,
  SchedulerProps,
  ServiceType,
  ViewMode,
  DetailDisplayMode,
  AppointmentLayout,
  TimeSlot,
} from 'react-appointment-scheduler';
```

## License

MIT
