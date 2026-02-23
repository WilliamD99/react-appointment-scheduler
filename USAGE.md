# Using react-appointment-scheduler in Your Project

This guide explains how to integrate **react-appointment-scheduler** into another app: data models, styling, and create-appointment flow (including multiple jobs per appointment).

---

## Installation

```bash
npm install react-appointment-scheduler
# or
pnpm add react-appointment-scheduler
# or
yarn add react-appointment-scheduler
```

### Peer dependencies

The package requires **React 18+ or 19+** (and `react-dom`). Install them if not already present:

```bash
npm install react react-dom
```

---

## Making styling work

The scheduler ships its own CSS. You **must** import it once in your app (e.g. in your root layout or main entry file) so the calendar and modals look correct.

```tsx
// In your app entry (e.g. main.tsx, _app.tsx, layout.tsx)
import 'react-appointment-scheduler/styles.css';
```

- **Bundler**: Ensure your bundler can resolve the package’s `styles.css` (Vite, Webpack, Next.js, etc. handle `node_modules` by default).
- **Scoping**: All scheduler class names and CSS variables are prefixed (e.g. `--scheduler-*`, `.scheduler-container`) to avoid clashing with your app.
- **Container height**: Give the scheduler a defined height (e.g. `height: 600px` or `min-height: 70vh`), otherwise the grid may collapse.

```tsx
<div style={{ height: '600px' }}>
  <Scheduler appointments={appointments} services={services} />
</div>
```

---

## Data model the package expects

### Core types

All of these are exported from the package so you can type your state and API layer.

#### `Appointment`

What you pass in `appointments` and what you get back from your API to display:

```ts
interface Appointment {
  id: string;
  client: { name: string; path: string };   // path can be '' or a route/id
  jobs?: { serviceType: string; technicianId?: string }[]; // optional multi-job data
  serviceType: string;                        // service ID (e.g. 'classic-lashes')
  artist?: string | { id: string; name?: string };  // technician id or object
  startTime: Date;
  duration: number;                          // minutes
  email: string;
  phone?: string;
  notes?: string;
}
```

- **client**: Always an object `{ name, path }`. The scheduler uses `client.name` for display.
- **jobs**: Optional list of jobs. When present, detail edit views let users select which existing job to edit.
- **serviceType**: A string ID that must match one of your **services** (see below). Kept for backward compatibility; typically mirrors the first job's service.
- **artist**: Optional; technician ID (string) or `{ id, name? }`. Kept for backward compatibility; typically mirrors the first job's technician.

#### `Service`

Defines bookable services (used in the Create Appointment modal and for display):

```ts
interface Service {
  id: string;
  name: string;
  category: string | { id: number; name: string };  // for grouping in the modal
  duration?: number;   // minutes; used for total duration when creating multi-job appointments
}
```

- **category**: Either a string (e.g. `'Lashes'`) or an object `{ id, name }` for grouping in the service dropdown.
- **duration**: If you omit it, the scheduler treats duration as 0 for that service (no default 60). Set it for each service (e.g. 30, 60) so the modal shows correct “X min” and total duration.

#### `Technician`

Staff who can be assigned to jobs:

```ts
interface Technician {
  id: string;
  name: string;
  color?: string;   // optional hex, e.g. '#fb7185'; used for appointment blocks
}
```

#### `Job` (per-appointment jobs)

One appointment can have **multiple jobs**. Each job is one service + optional technician:

```ts
interface Job {
  serviceType: string;   // service ID
  technicianId?: string;
}
```

#### `NewAppointmentData`

Payload passed to `onNewAppointment` when the user submits the Create Appointment form:

```ts
interface NewAppointmentData {
  client: { name: string; path: string };
  jobs: Job[];           // one or more { serviceType, technicianId? }
  startTime: Date;
  duration: number;     // sum of all selected service durations
  email: string;
  phone?: string;
  notes?: string;
}
```

- There is **no single “artist”** at the top level; assignment is per job via `Job.technicianId`.
- Your backend should create one appointment and multiple job records (or equivalent) from `jobs`.

#### `TechnicianServices`

Maps which technician can perform which services. Used to filter the technician dropdown in the Create Appointment modal (by selected service):

```ts
type TechnicianServices = Record<string, string[]>;
// technicianId -> array of service IDs they can perform

// Example:
const technicianServices = {
  'tech-1': ['service-a', 'service-b'],
  'tech-2': ['service-a', 'service-c'],
};
```

#### `Client`

Used in both `Appointment` and `NewAppointmentData`:

```ts
type Client = { name: string; path: string };
```

#### Optional: `DaySchedule` (business hours)

If you want different hours per day:

```ts
interface DaySchedule {
  day: string;   // 'sunday' | 'monday' | ... | 'saturday' (lowercase)
  open: string;  // hour 0–23, e.g. '9'
  close: string; // hour 0–23, e.g. '18'
}
```

---

## Basic usage

```tsx
import { Scheduler } from 'react-appointment-scheduler';
import type { Appointment, Service, Technician } from 'react-appointment-scheduler';
import 'react-appointment-scheduler/styles.css';

const appointments: Appointment[] = [
  {
    id: '1',
    client: { name: 'Jane Doe', path: '' },
    serviceType: 'classic-lashes',
    artist: 'tech-1',
    startTime: new Date('2025-02-17T09:00:00'),
    duration: 60,
    email: 'jane@example.com',
  },
];

const services: Service[] = [
  { id: 'classic-lashes', name: 'Classic Lashes', category: 'Lashes', duration: 60 },
  { id: 'quick-touchup', name: 'Quick Touch-up', category: 'Lashes', duration: 30 },
];

const technicians: Technician[] = [
  { id: 'tech-1', name: 'Sarah', color: '#fb7185' },
  { id: 'tech-2', name: 'Alex', color: '#a78bfa' },
];

const technicianServices = {
  'tech-1': ['classic-lashes', 'quick-touchup'],
  'tech-2': ['classic-lashes'],
};

function App() {
  return (
    <div style={{ height: '600px' }}>
      <Scheduler
        appointments={appointments}
        services={services}
        technicians={technicians}
        technicianServices={technicianServices}
        startHour={8}
        endHour={21}
        view="week"
        detailDisplay="modal"
        onSelectAppointment={(apt) => console.log('Selected', apt)}
        onNewAppointment={(data) => console.log('Create', data)}
        onUpdateAppointment={(apt) => console.log('Update', apt)}
        onDeleteAppointment={(id) => console.log('Delete', id)}
        onRescheduleAppointment={(id, newStart) => console.log('Reschedule', id, newStart)}
      />
    </div>
  );
}
```

---

## Create appointment flow (multiple jobs)

- User opens the Create Appointment modal (e.g. by clicking an empty slot).
- In the modal they add **jobs**: each job = one **service** + optional **technician**.
- They can add several jobs (e.g. Service A with Tech 1, same Service A with Tech 2 for a friend).
- On submit, you receive **one** `NewAppointmentData` with a **jobs** array.

### Handling `onNewAppointment` in your app

```tsx
const handleNewAppointment = (data: NewAppointmentData) => {
  // data.client  -> { name, path }
  // data.jobs    -> [ { serviceType, technicianId? }, ... ]
  // data.startTime, data.duration, data.email, data.phone?, data.notes?

  // Example: send to your API
  await yourApi.createAppointment({
    clientName: data.client.name,
    clientPath: data.client.path,
    startTime: data.startTime.toISOString(),
    duration: data.duration,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
    jobs: data.jobs.map((j) => ({
      serviceId: j.serviceType,
      technicianId: j.technicianId ?? null,
    })),
  });

  // Then refresh your appointments list or add the new appointment to state.
};
```

- **duration** in `NewAppointmentData` is the sum of each selected service’s `duration` (from your `Service[]`). You can ignore it and compute your own from `jobs` if your backend uses different rules (e.g. buffer time).

---

## Scheduler props reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appointments` | `Appointment[]` | required | Appointments to display |
| `services` | `Service[]` or `string[]` | required | Services (strings become `{ id, name, category: 'general' }`) |
| `technicians` | `Technician[]` | `[]` | Staff list; used in Create modal and block colors |
| `technicianServices` | `TechnicianServices` | - | Maps technician ID → service IDs; filters technician dropdown by service |
| `startHour` | `number` | `8` | Grid start hour (0–23) |
| `endHour` | `number` | `21` | Grid end hour (0–23) |
| `businessHours` | `DaySchedule[]` or `null` | - | Per-day hours; overrides startHour/endHour when set |
| `view` | `'day' \| 'week'` | `'week'` | View mode |
| `selectedDate` | `Date` | today | Focused date |
| `detailDisplay` | `'modal' \| 'panel'` | `'modal'` | How appointment details are shown |
| `onSelectAppointment` | `(apt: Appointment) => void` | - | Click on an appointment |
| `onCreateAppointment` | `(start: Date, end: Date) => void` | - | Legacy: click on empty slot (no form data) |
| `onNewAppointment` | `(data: NewAppointmentData) => void` | - | New appointment created from modal (with jobs) |
| `onUpdateAppointment` | `(apt: Appointment) => void` | - | User saved changes in detail view |
| `onDeleteAppointment` | `(id: string) => void` | - | User deleted an appointment |
| `onRescheduleAppointment` | `(id: string, newStart: Date) => void` | - | Drag-and-drop reschedule |

---

## Update appointment callback (`onUpdateAppointment`)

When a user saves edits in the detail modal/panel, you receive an `Appointment` in `onUpdateAppointment`.

### What can be updated in the UI

- Appointment-level fields: `startTime`, `notes`
- Job-level fields: selected job `serviceType` and `technicianId`
- Existing jobs only (no add/remove in update flow)

### Payload notes

- `apt.jobs` contains the updated job list (when editing happened through the current UI).
- `apt.serviceType` and `apt.artist` are still included for compatibility and mirror the first job when jobs exist.
- `apt.duration` is recalculated from job service durations when possible.

### Typical local state update

```tsx
const handleUpdateAppointment = (updated: Appointment) => {
  setAppointments((prev) =>
    prev.map((apt) => (apt.id === updated.id ? updated : apt))
  );
};
```

### Typical API persistence

```tsx
const handleUpdateAppointment = async (updated: Appointment) => {
  await api.updateAppointment(updated.id, {
    startTime: updated.startTime.toISOString(),
    duration: updated.duration,
    notes: updated.notes ?? null,
    serviceType: updated.serviceType,
    artistId: typeof updated.artist === 'string' ? updated.artist : updated.artist?.id ?? null,
    jobs: (updated.jobs ?? []).map((job) => ({
      serviceId: job.serviceType,
      technicianId: job.technicianId ?? null,
    })),
  });

  setAppointments((prev) =>
    prev.map((apt) => (apt.id === updated.id ? updated : apt))
  );
};
```

If your backend is not job-aware yet, you can keep using `serviceType`/`artist` and ignore `jobs` until migration.

---

## Theming and CSS variables

The scheduler uses **CSS custom properties** prefixed with `--scheduler-*` so you can override them without editing the package.

### Semantic tokens (recommended overrides)

Override these in your own CSS (e.g. in `:root` or a wrapper class) to match your app:

```css
:root {
  /* Backgrounds */
  --scheduler-bg-primary: #ffffff;
  --scheduler-bg-secondary: #fafaf9;
  --scheduler-bg-tertiary: rgba(250, 250, 249, 0.5);
  --scheduler-bg-hover: rgba(245, 245, 244, 0.5);

  /* Text */
  --scheduler-text-primary: #1c1917;
  --scheduler-text-secondary: #44403c;
  --scheduler-text-tertiary: #78716c;

  /* Borders */
  --scheduler-border-primary: #e7e5e4;
  --scheduler-border-secondary: #d6d3d1;
  --scheduler-border-tertiary: #a8a29e;

  /* Layout */
  --scheduler-slot-height: 60px;
  --scheduler-time-column-width: 80px;

  /* Radii & shadows */
  --scheduler-border-radius-sm: 0.375rem;
  --scheduler-border-radius-md: 0.5rem;
  --scheduler-border-radius-lg: 0.75rem;
  --scheduler-border-radius-xl: 1rem;
  --scheduler-border-radius-2xl: 1.5rem;
  --scheduler-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --scheduler-transition-fast: 150ms ease-out;
}
```

### Dark mode

The built-in dark theme is applied when the **document root** has `data-theme="dark"`:

```tsx
document.documentElement.setAttribute('data-theme', 'dark');
```

You can use the package’s theme helpers:

```tsx
import { ThemeToggle, initializeTheme } from 'react-appointment-scheduler';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    initializeTheme(); // reads localStorage / system preference and sets data-theme
  }, []);

  return (
    <div>
      <ThemeToggle />
      <Scheduler {...props} />
    </div>
  );
}
```

Theme is stored in `localStorage` under the key `scheduler-theme` (`'light'` or `'dark'`).

### Palette variables

If you need to tweak accent or service-type colors, the stylesheet also defines palettes (e.g. `--scheduler-color-rose-400`, `--scheduler-color-violet-400`). You can override those in `:root` or `[data-theme="dark"]` as needed.

---

## TypeScript

Import types from the package:

```tsx
import type {
  Appointment,
  NewAppointmentData,
  Job,
  Service,
  ServiceType,
  Technician,
  TechnicianServices,
  Client,
  SchedulerProps,
  ViewMode,
  DetailDisplayMode,
  DaySchedule,
} from 'react-appointment-scheduler';
```

Use them for state, API requests, and props so your app stays in sync with the data model above.

---

## Checklist for your other project

1. **Install** the package and **import** `react-appointment-scheduler/styles.css` once.
2. **Shape your data** to `Appointment[]` (with `client: { name, path }`, `serviceType`, etc.) and pass `services` (with `duration` for correct 30/60 min display).
3. **Pass `technicians` and `technicianServices`** so the Create modal shows the right technicians per service.
4. **Handle `onNewAppointment`** and persist `data.jobs` (and the rest) to your backend; create one appointment and multiple jobs (or your equivalent).
5. **Give the scheduler a height** (e.g. `height: '600px'`).
6. **(Optional)** Override `--scheduler-*` variables or use `ThemeToggle` + `initializeTheme()` for light/dark.

For more on the built-in theme (e.g. `getCurrentTheme`, `setTheme`), see [THEME_DOCS.md](./THEME_DOCS.md) in this repo.
