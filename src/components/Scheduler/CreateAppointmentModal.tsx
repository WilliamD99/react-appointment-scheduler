import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { ServiceType, NewAppointmentData } from '../../types/scheduler';
import { getServiceColors } from '../../utils/colorUtils';

/**
 * CreateAppointmentModal Component
 * 
 * A modal for creating new appointments with form fields for:
 * - Client name
 * - Service type
 * - Start time
 * - Duration
 * - Artist (optional)
 * - Phone (optional)
 * - Notes (optional)
 */

interface CreateAppointmentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when appointment is created */
  onCreate: (appointment: NewAppointmentData) => void;
  /** Pre-selected start time (from slot click) */
  initialStartTime?: Date | null;
  /** Pre-selected end time (from slot click) */
  initialEndTime?: Date | null;
}

const SERVICE_OPTIONS: { value: ServiceType; label: string; duration: number }[] = [
  { value: 'Classic', label: 'Classic Lashes', duration: 90 },
  { value: 'Hybrid', label: 'Hybrid Lashes', duration: 120 },
  { value: 'Volume', label: 'Volume Lashes', duration: 150 },
  { value: 'Refill', label: 'Refill', duration: 60 },
];

const ARTIST_OPTIONS = ['Emma Wilson', 'Sofia Chen', 'Maya Rodriguez'];

export const CreateAppointmentModal = memo(function CreateAppointmentModal({
  isOpen,
  onClose,
  onCreate,
  initialStartTime,
  initialEndTime,
}: CreateAppointmentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Classic');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(90);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form and set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientName('');
      setPhone('');
      setNotes('');
      setServiceType('Classic');
      setArtist('');
      setDuration(90);

      if (initialStartTime) {
        // Format date as YYYY-MM-DD for input
        const year = initialStartTime.getFullYear();
        const month = String(initialStartTime.getMonth() + 1).padStart(2, '0');
        const day = String(initialStartTime.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
        
        // Format time as HH:MM for input
        const hours = String(initialStartTime.getHours()).padStart(2, '0');
        const minutes = String(initialStartTime.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);

        // Calculate duration from end time if available
        if (initialEndTime) {
          const diffMinutes = Math.round((initialEndTime.getTime() - initialStartTime.getTime()) / 60000);
          if (diffMinutes >= 30) {
            setDuration(diffMinutes);
          }
        }
      } else {
        // Default to today and next hour
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
        
        const nextHour = now.getHours() + 1;
        setTime(`${String(nextHour).padStart(2, '0')}:00`);
      }
    }
  }, [isOpen, initialStartTime, initialEndTime]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Update duration when service type changes
  const handleServiceChange = useCallback((newService: ServiceType) => {
    setServiceType(newService);
    const service = SERVICE_OPTIONS.find(s => s.value === newService);
    if (service) {
      setDuration(service.duration);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim() || !date || !time) {
      return;
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    const appointmentData: NewAppointmentData = {
      clientName: clientName.trim(),
      serviceType,
      startTime,
      duration,
      ...(artist && { artist }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    onCreate(appointmentData);
    onClose();
  }, [clientName, serviceType, artist, date, time, duration, phone, notes, onCreate, onClose]);

  if (!isOpen) {
    return null;
  }

  const colors = getServiceColors(serviceType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Colored header */}
        <div className={`px-6 py-4 ${colors.bg} rounded-t-2xl border-b ${colors.border}`}>
          <h2
            id="create-modal-title"
            className={`text-xl font-semibold ${colors.text}`}
          >
            New Appointment
          </h2>
          <p className={`text-sm mt-1 opacity-75 ${colors.text}`}>
            Fill in the details below to create a new booking
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${colors.text} opacity-75 hover:opacity-100 hover:bg-white/20 transition-all`}
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Client Name */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-stone-700 mb-1.5">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client's full name"
              required
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-stone-700 mb-1.5">
              Service Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map((service) => {
                const serviceColors = getServiceColors(service.value);
                const isSelected = serviceType === service.value;
                return (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => handleServiceChange(service.value)}
                    className={`
                      px-4 py-3 rounded-xl border-2 text-left transition-all
                      ${isSelected 
                        ? `${serviceColors.bg} ${serviceColors.border} ${serviceColors.text}` 
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                      }
                    `}
                  >
                    <span className="block font-medium text-sm">{service.label}</span>
                    <span className={`block text-xs mt-0.5 ${isSelected ? 'opacity-75' : 'text-stone-400'}`}>
                      {service.duration} min
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-stone-700 mb-1.5">
                Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-stone-700 mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={15}
              max={300}
              step={15}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Artist */}
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-stone-700 mb-1.5">
              Lash Artist
            </label>
            <select
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all bg-white"
            >
              <option value="">Select an artist (optional)</option>
              {ARTIST_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow"
            >
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CreateAppointmentModal;
