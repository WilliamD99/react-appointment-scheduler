import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Appointment, ServiceType, Service, Technician } from '../../types/scheduler';
import { getArtistId, getArtistDisplayName } from '../../utils/artistUtils';
import { formatFullDate } from '../../utils/timeUtils';

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
  /** List of available services with id, name, and category */
  services: Service[];
  /** List of available technicians with id and name */
  technicians?: Technician[];
}

export const DetailModal = memo(function DetailModal({
  appointment,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  services,
  technicians = [],
}: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Group services by category for the edit dropdown
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    services.forEach((service) => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [services]);

  // Helper to get service name by ID
  const getServiceName = useCallback((serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service?.name ?? serviceId;
  }, [services]);

  // Form state for editing
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Classic');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form when appointment changes or edit mode is entered
  useEffect(() => {
    if (appointment && isEditing) {
      setClientName(appointment.clientName);
      setServiceType(appointment.serviceType);
      setArtist(getArtistId(appointment.artist) || '');
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
    if (!appointment || !date || !time) {
      return;
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    const updatedAppointment: Appointment = {
      id: appointment.id,
      clientName: appointment.clientName, // Keep original client name
      serviceType,
      startTime,
      duration: appointment.duration, // Keep original duration
      email: appointment.email, // Keep original email
      ...(artist && { artist }),
      ...(appointment.phone && { phone: appointment.phone }), // Keep original phone
      ...(notes.trim() && { notes: notes.trim() }),
    };

    if (onUpdate) {
      onUpdate(updatedAppointment);
    }
    setIsEditing(false);
  }, [appointment, serviceType, artist, date, time, notes, onUpdate]);

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


  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div
        className="modal-overlay"
        onClick={isEditing ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div ref={modalRef} tabIndex={-1} className="modal-content">
        {/* Colored header strip */}
        <div
          className="modal-header-strip"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={isEditing ? handleCancelEdit : onClose}
          className="modal-close-btn"
          aria-label={isEditing ? 'Cancel editing' : 'Close'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isEditing ? (
          /* Edit Mode */
          <div className="modal-body">
            <h2 className="modal-title">Edit Appointment</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Client Name (read-only in edit mode) */}
              <div className="form-group">
                <label htmlFor="edit-clientName" className="form-label">
                  Client Name
                </label>
                <input
                  type="text"
                  id="edit-clientName"
                  value={clientName}
                  disabled
                  className="form-input"
                />
              </div>

              {/* Service Type */}
              <div className="form-group">
                <label className="form-label">
                  Service <span className="required">*</span>
                </label>
                {/* Services grouped by category */}
                {Object.keys(servicesByCategory).map((category) => (
                  <div key={category} className="service-category">
                    <span className="service-category-label">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <div className="service-selector">
                      {servicesByCategory[category].map((service) => {
                        const isSelected = serviceType === service.id;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setServiceType(service.id);
                            }}
                            className={`service-option ${isSelected ? 'selected ' : ''}`}
                          >
                            <span className="service-option-label">{service.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Date and Time */}
              <div className="form-group">
                <div className="form-grid">
                  <div>
                    <label htmlFor="edit-date" className="form-label">
                      Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="edit-date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-time" className="form-label">
                      Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="edit-time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Technician */}
              <div className="form-group">
                <label htmlFor="edit-technician" className="form-label">Technician</label>
                <select
                  id="edit-technician"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a technician (optional)</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>


              {/* Notes */}
              <div className="form-group">
                <label htmlFor="edit-notes" className="form-label">Notes</label>
                <textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="form-textarea"
                />
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm ? (
                <div className="delete-confirm">
                  <p className="delete-confirm-text">
                    Are you sure you want to delete this appointment? This action cannot be undone.
                  </p>
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
                <div className="btn-group">
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger-outline" style={{ flex: 'none' }}>
                    Delete
                  </button>
                  <button type="button" onClick={handleCancelEdit} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* View Mode */
          <div className="modal-body">
            {/* Service badge */}
            <div className={`service-badge`}>
              <span className="service-badge-dot" />
              <span className="service-badge-text">{getServiceName(appointment.serviceType)}</span>
            </div>

            {/* Client name */}
            <h2 id="modal-title" className="detail-client-name">{appointment.clientName}</h2>

            {/* Details grid */}
            <div className="detail-list">
              {/* Date */}
              <div className="detail-item">
                <div className="detail-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="detail-item-label">Date</p>
                  <p className="detail-item-value">{formatFullDate(appointment.startTime)}</p>
                </div>
              </div>

              {/* Time */}
              <div className="detail-item">
                <div className="detail-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="detail-item-label">Time</p>
                  <p className="detail-item-value">{appointment.duration} minutes</p>
                </div>
              </div>

              {/* Technician (if assigned) */}
              {getArtistId(appointment.artist) && (
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="detail-item-label">Technician</p>
                    <p className="detail-item-value">{getArtistDisplayName(appointment.artist, technicians)}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {appointment.email && (
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="detail-item-label">Email</p>
                    <p className="detail-item-value">{appointment.email}</p>
                  </div>
                </div>
              )}

              {/* Phone (if provided) */}
              {appointment.phone && (
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="detail-item-label">Phone</p>
                    <p className="detail-item-value">{appointment.phone}</p>
                  </div>
                </div>
              )}

              {/* Notes (if provided) */}
              {appointment.notes && (
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="detail-item-label">Notes</p>
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
          </div>
        )}
      </div>
    </div>
  );
});

export default DetailModal;
