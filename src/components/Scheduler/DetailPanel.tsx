import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Appointment, ServiceType } from '../../types/scheduler';
import { getServiceColors, getServiceDisplayName, getDefaultDuration } from '../../utils/colorUtils';
import { formatTime, formatFullDate, addMinutes } from '../../utils/timeUtils';

/**
 * DetailPanel Component
 * 
 * A slide-in side panel that displays appointment details with edit capability.
 * Alternative to the modal for users who prefer to keep context visible.
 * 
 * Features:
 * - View and Edit modes
 * - Slides in from the right
 * - Escape key to close
 * - Focus trap for accessibility
 * - Smooth animations
 */

interface DetailPanelProps {
  /** The appointment to display (null when closed) */
  appointment: Appointment | null;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Callback when appointment is updated */
  onUpdate?: (appointment: Appointment) => void;
  /** Callback when appointment is deleted */
  onDelete?: (id: string) => void;
  /** List of available service types */
  services: string[];
}

const ARTIST_OPTIONS = ['Emma Wilson', 'Sofia Chen', 'Maya Rodriguez'];

export const DetailPanel = memo(function DetailPanel({
  appointment,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  services,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Create service options from provided services array
  const serviceOptions = useMemo(() => {
    return services.map((service) => {
      // Check if service is a valid ServiceType
      const isValidServiceType = ['Classic', 'Hybrid', 'Volume', 'Refill'].includes(service);
      const duration = isValidServiceType 
        ? getDefaultDuration(service as ServiceType)
        : 90; // Default duration for unknown services
      
      // Format label: capitalize first letter and add "Lashes" if not already present
      const label = service.charAt(0).toUpperCase() + service.slice(1);
      
      return {
        value: service as ServiceType,
        label,
        duration,
      };
    });
  }, [services]);

  // Form state for editing
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Classic');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(90);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form when appointment changes or edit mode is entered
  useEffect(() => {
    if (appointment && isEditing) {
      setClientName(appointment.clientName);
      setServiceType(appointment.serviceType);
      setArtist(appointment.artist || '');
      setDuration(appointment.duration);
      setEmail(appointment.email || '');
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

  // Reset edit state when panel closes
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

  // Focus the panel when it opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!appointment || !clientName.trim() || !date || !time || !email.trim()) {
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
      email: email.trim(),
      ...(artist && { artist }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    if (onUpdate) {
      onUpdate(updatedAppointment);
    }
    setIsEditing(false);
  }, [appointment, clientName, serviceType, artist, date, time, duration, email, phone, notes, onUpdate]);

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

  if (!appointment) {
    return null;
  }

  const colors = getServiceColors(isEditing ? serviceType : appointment.serviceType);
  const endTime = addMinutes(appointment.startTime, appointment.duration);

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="panel-title">
      {/* Panel content */}
      <div ref={panelRef} tabIndex={-1} className="side-panel-content">
        {/* Colored header strip */}
        <div className="panel-header-strip" style={{ backgroundColor: colors.badgeColor }} />

        {/* Header */}
        <div className="panel-header">
          <h2 id="panel-title" className="panel-title">
            {isEditing ? 'Edit Appointment' : 'Appointment Details'}
          </h2>
          <button
            type="button"
            onClick={isEditing ? handleCancelEdit : onClose}
            className="modal-close-btn"
            style={{ position: 'static' }}
            aria-label={isEditing ? 'Cancel editing' : 'Close panel'}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="panel-body">
          {isEditing ? (
            /* Edit Mode */
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Client Name */}
              <div className="form-group">
                <label htmlFor="panel-clientName" className="form-label">
                  Client Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="panel-clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="form-input sm"
                />
              </div>

              {/* Service Type */}
              <div className="form-group">
                <label className="form-label">
                  Service Type <span className="required">*</span>
                </label>
                <div className="service-selector">
                  {serviceOptions.map((service) => {
                    // Try to get colors for valid ServiceType, otherwise use default
                    let serviceColors;
                    try {
                      serviceColors = getServiceColors(service.value);
                    } catch {
                      // Fallback for unknown service types
                      serviceColors = { className: 'service-classic', badgeColor: 'var(--color-rose-400)' };
                    }
                    const isSelected = serviceType === service.value;
                    return (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => {
                          setServiceType(service.value);
                          setDuration(service.duration);
                        }}
                        className={`service-option ${isSelected ? 'selected ' + serviceColors.className : ''}`}
                        style={{ padding: '0.5rem' }}
                      >
                        <span className="service-option-label" style={{ fontSize: '0.75rem' }}>{service.label}</span>
                        <span className="service-option-duration">{service.duration} min</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date and Time */}
              <div className="form-group">
                <div className="form-grid" style={{ gap: '0.5rem' }}>
                  <div>
                    <label htmlFor="panel-date" className="form-label">
                      Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="panel-date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="form-input sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="panel-time" className="form-label">
                      Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="panel-time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="form-input sm"
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="form-group">
                <label htmlFor="panel-duration" className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  id="panel-duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={15}
                  max={300}
                  step={15}
                  className="form-input sm"
                />
              </div>

              {/* Artist */}
              <div className="form-group">
                <label htmlFor="panel-artist" className="form-label">Lash Artist</label>
                <select
                  id="panel-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="form-select sm"
                >
                  <option value="">Select an artist (optional)</option>
                  {ARTIST_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="panel-email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="panel-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                  className="form-input sm"
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="panel-phone" className="form-label">Phone Number (optional)</label>
                <input
                  type="tel"
                  id="panel-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="form-input sm"
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="panel-notes" className="form-label">Notes</label>
                <textarea
                  id="panel-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="form-textarea sm"
                />
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm ? (
                <div className="delete-confirm sm">
                  <p className="delete-confirm-text">Delete this appointment?</p>
                  <div className="delete-confirm-actions">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-outline">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete} className="btn btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Actions */
                <div className="btn-group" style={{ gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger-outline" style={{ flex: 'none', padding: '0.5rem 0.75rem' }}>
                    Delete
                  </button>
                  <button type="button" onClick={handleCancelEdit} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
                    Save
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* View Mode */
            <>
              {/* Service badge */}
              <div className={`service-badge ${colors.className}`}>
                <span className="service-badge-dot" style={{ backgroundColor: colors.badgeColor }} />
                <span className="service-badge-text">{getServiceDisplayName(appointment.serviceType)}</span>
              </div>

              {/* Client name */}
              <h3 className="detail-client-name" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                {appointment.clientName}
              </h3>

              {/* Details */}
              <div className="detail-list" style={{ gap: '1rem' }}>
                {/* Date */}
                <div className="detail-item">
                  <div className="detail-icon lg">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="detail-item-content">
                    <p className="detail-item-label xs">Date</p>
                    <p className="detail-item-value">{formatFullDate(appointment.startTime)}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="detail-item">
                  <div className="detail-icon lg">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="detail-item-content">
                    <p className="detail-item-label xs">Time</p>
                    <p className="detail-item-value">{formatTime(appointment.startTime)} – {formatTime(endTime)}</p>
                    <p className="detail-item-secondary">Duration: {appointment.duration} minutes</p>
                  </div>
                </div>

                {/* Artist */}
                {appointment.artist && (
                  <div className="detail-item">
                    <div className="detail-icon lg">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="detail-item-content">
                      <p className="detail-item-label xs">Lash Artist</p>
                      <p className="detail-item-value">{appointment.artist}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {appointment.email && (
                  <div className="detail-item">
                    <div className="detail-icon lg">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="detail-item-content">
                      <p className="detail-item-label xs">Email</p>
                      <p className="detail-item-value">{appointment.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {appointment.phone && (
                  <div className="detail-item">
                    <div className="detail-icon lg">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="detail-item-content">
                      <p className="detail-item-label xs">Phone</p>
                      <p className="detail-item-value">{appointment.phone}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {appointment.notes && (
                  <div className="detail-item">
                    <div className="detail-icon lg">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="detail-item-content">
                      <p className="detail-item-label xs">Notes</p>
                      <p className="detail-item-text">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit button */}
              {onUpdate && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: '1.5rem' }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Appointment
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default DetailPanel;
