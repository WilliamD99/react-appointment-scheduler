import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { Appointment, ServiceType } from '../../types/scheduler';
import { getServiceColors, getServiceDisplayName } from '../../utils/colorUtils';
import { formatTime, formatFullDate, addMinutes } from '../../utils/timeUtils';

/**
 * DetailModal Component
 * 
 * A centered modal overlay that displays appointment details with edit capability.
 * 
 * Features:
 * - View and Edit modes
 * - Backdrop blur effect
 * - Click outside to close
 * - Escape key to close
 * - Focus trap for accessibility
 * - Smooth enter/exit animations
 */

interface DetailModalProps {
  /** The appointment to display (null when closed) */
  appointment: Appointment | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when appointment is updated */
  onUpdate?: (appointment: Appointment) => void;
  /** Callback when appointment is deleted */
  onDelete?: (id: string) => void;
}

const SERVICE_OPTIONS: { value: ServiceType; label: string; duration: number }[] = [
  { value: 'Classic', label: 'Classic Lashes', duration: 90 },
  { value: 'Hybrid', label: 'Hybrid Lashes', duration: 120 },
  { value: 'Volume', label: 'Volume Lashes', duration: 150 },
  { value: 'Refill', label: 'Refill', duration: 60 },
];

const ARTIST_OPTIONS = ['Emma Wilson', 'Sofia Chen', 'Maya Rodriguez'];

export const DetailModal = memo(function DetailModal({
  appointment,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state for editing
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Classic');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(90);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form when appointment changes or edit mode is entered
  useEffect(() => {
    if (appointment && isEditing) {
      setClientName(appointment.clientName);
      setServiceType(appointment.serviceType);
      setArtist(appointment.artist || '');
      setDuration(appointment.duration);
      setPhone(appointment.phone || '');
      setNotes(appointment.notes || '');

      // Format date as YYYY-MM-DD for input
      const year = appointment.startTime.getFullYear();
      const month = String(appointment.startTime.getMonth() + 1).padStart(2, '0');
      const day = String(appointment.startTime.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);

      // Format time as HH:MM for input
      const hours = String(appointment.startTime.getHours()).padStart(2, '0');
      const minutes = String(appointment.startTime.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [appointment, isEditing]);

  // Reset edit state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  // Focus trap - focus the modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
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

  // Handle save
  const handleSave = useCallback(() => {
    if (!appointment || !clientName.trim() || !date || !time) {
      return;
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    const updatedAppointment: Appointment = {
      id: appointment.id,
      clientName: clientName.trim(),
      serviceType,
      startTime,
      duration,
      ...(artist && { artist }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    if (onUpdate) {
      onUpdate(updatedAppointment);
    }
    setIsEditing(false);
  }, [appointment, clientName, serviceType, artist, date, time, duration, phone, notes, onUpdate]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (appointment && onDelete) {
      onDelete(appointment.id);
      onClose();
    }
  }, [appointment, onDelete, onClose]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, []);

  if (!isOpen || !appointment) {
    return null;
  }

  const colors = getServiceColors(isEditing ? serviceType : appointment.serviceType);
  const endTime = addMinutes(appointment.startTime, appointment.duration);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isEditing ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto animate-in zoom-in-95 fade-in duration-200 outline-none"
      >
        {/* Colored header strip */}
        <div className={`h-2 rounded-t-2xl ${colors.badge}`} />

        {/* Close button */}
        <button
          type="button"
          onClick={isEditing ? handleCancelEdit : onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors z-10"
          aria-label={isEditing ? 'Cancel editing' : 'Close'}
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

        {isEditing ? (
          /* Edit Mode */
          <div className="p-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-5">
              Edit Appointment
            </h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              {/* Client Name */}
              <div>
                <label htmlFor="edit-clientName" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
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
                        onClick={() => setServiceType(service.value)}
                        className={`
                          px-3 py-2 rounded-xl border-2 text-left transition-all
                          ${isSelected 
                            ? `${serviceColors.bg} ${serviceColors.border} ${serviceColors.text}` 
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                          }
                        `}
                      >
                        <span className="block font-medium text-sm">{service.label}</span>
                        <span className={`block text-xs ${isSelected ? 'opacity-75' : 'text-stone-400'}`}>
                          {service.duration} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="edit-time" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="edit-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="edit-duration" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="edit-duration"
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
                <label htmlFor="edit-artist" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Lash Artist
                </label>
                <select
                  id="edit-artist"
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
                <label htmlFor="edit-phone" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none"
                />
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800 mb-3">
                    Are you sure you want to delete this appointment? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Actions */
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 border border-red-300 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* View Mode */
          <div className="p-6">
            {/* Service badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.text} mb-4`}
            >
              <span className={`w-2 h-2 rounded-full ${colors.badge}`} />
              <span className="text-sm font-medium">
                {getServiceDisplayName(appointment.serviceType)}
              </span>
            </div>

            {/* Client name */}
            <h2
              id="modal-title"
              className="text-2xl font-semibold text-stone-900 mb-4"
            >
              {appointment.clientName}
            </h2>

            {/* Details grid */}
            <div className="space-y-3">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-stone-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Date</p>
                  <p className="text-stone-900 font-medium">
                    {formatFullDate(appointment.startTime)}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-stone-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Time</p>
                  <p className="text-stone-900 font-medium">
                    {formatTime(appointment.startTime)} – {formatTime(endTime)}
                  </p>
                  <p className="text-sm text-stone-500">
                    {appointment.duration} minutes
                  </p>
                </div>
              </div>

              {/* Artist (if assigned) */}
              {appointment.artist && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-stone-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Lash Artist</p>
                    <p className="text-stone-900 font-medium">
                      {appointment.artist}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone (if provided) */}
              {appointment.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-stone-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Phone</p>
                    <p className="text-stone-900 font-medium">
                      {appointment.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes (if provided) */}
              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-stone-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Notes</p>
                    <p className="text-stone-700">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Edit button */}
            {onUpdate && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Appointment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default DetailModal;
