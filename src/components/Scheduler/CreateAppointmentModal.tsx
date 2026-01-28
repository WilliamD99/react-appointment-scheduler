import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ServiceType, NewAppointmentData, TechnicianServices, Service, Technician } from '../../types/scheduler';

/**
 * CreateAppointmentModal Component
 * 
 * A modal for creating new appointments with form fields for:
 * - Client name
 * - Service type
 * - Start time
 * - Email (required)
 * - Phone (optional)
 * - Artist (optional)
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
  /** Pre-selected technician ID (from slot click in day view) */
  initialTechnicianId?: string | null;
  /** List of available technicians with id and name */
  technicians?: Technician[];
  /** List of available services with id, name, and category */
  services: Service[];
  /** 
   * Map of technician IDs to service IDs they can perform.
   * When provided, services will be filtered based on the selected technician.
   */
  technicianServices?: TechnicianServices;
}

export const CreateAppointmentModal = memo(function CreateAppointmentModal({
  isOpen,
  onClose,
  onCreate,
  initialStartTime,
  initialEndTime,
  initialTechnicianId,
  technicians = [],
  services,
  technicianServices,
}: CreateAppointmentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  // Get available services for the selected technician
  const availableServices = useMemo(() => {
    // If technicianServices map is provided and a technician is selected
    if (technicianServices && technicianId && technicianServices[technicianId]) {
      // Return only services this technician can perform (filter by service ID)
      const techServiceIds = technicianServices[technicianId];
      return services.filter(service => techServiceIds.includes(service.id));
    }
    // Otherwise, return all services
    return services;
  }, [services, technicianServices, technicianId]);

  // Get the selected technician object for display
  const selectedTechnician = useMemo(() => {
    return technicians.find(t => t.id === technicianId);
  }, [technicians, technicianId]);

  // Group services by category for better organization
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    availableServices.forEach((service) => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [availableServices]);

  // Get unique categories in order
  const categories = useMemo(() => {
    return Object.keys(servicesByCategory);
  }, [servicesByCategory]);

  // Service type now stores the service ID
  const [serviceType, setServiceType] = useState<ServiceType>(
    availableServices.length > 0 ? availableServices[0].id : ''
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Reset form and set initial values when modal opens.
  // IMPORTANT: Do NOT include availableServices in deps — it depends on technicianId.
  // Including it would re-run this effect when the user selects a technician and
  // reset technicianId back to initialTechnicianId, preventing the selection from sticking.
  useEffect(() => {
    if (isOpen) {
      setClientName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setSubmitError('');
      // Pre-select technician if provided (from day view slot click)
      const initialTechId = initialTechnicianId || '';
      setTechnicianId(initialTechId);

      // Compute initial available services for the pre-selected technician (not state)
      let initialAvailable = services;
      if (technicianServices && initialTechId && technicianServices[initialTechId]) {
        const techServiceIds = technicianServices[initialTechId];
        initialAvailable = services.filter(service => techServiceIds.includes(service.id));
      }
      setServiceType(initialAvailable.length > 0 ? initialAvailable[0].id : '');

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
  }, [isOpen, initialStartTime, initialEndTime, initialTechnicianId, services, technicianServices]);

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

  // Get duration based on service ID - looks up from service object or uses default
  const getServiceDuration = useCallback((serviceId: ServiceType): number => {
    const service = services.find(s => s.id === serviceId);
    // Use service's duration if defined, otherwise default to 60 minutes
    return service?.duration ?? 60;
  }, [services]);

  // Update duration when service type changes
  const handleServiceChange = useCallback((newService: ServiceType) => {
    setServiceType(newService);
  }, []);

  // Handle technician change - reset service if not available for new technician
  const handleTechnicianChange = useCallback((newTechnicianId: string) => {
    setTechnicianId(newTechnicianId);
    
    // Check if current service is available for the new technician
    if (technicianServices && newTechnicianId && technicianServices[newTechnicianId]) {
      const techServiceIds = technicianServices[newTechnicianId];
      if (!techServiceIds.includes(serviceType)) {
        // Current service not available, reset to first available
        // Find a service that's both in techServiceIds and main services list
        const firstAvailable = services.find(s => techServiceIds.includes(s.id));
        if (firstAvailable) {
          setServiceType(firstAvailable.id);
        }
      }
    }
  }, [technicianServices, serviceType, services]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!clientName.trim() || !date || !time || !email.trim()) {
      return;
    }

    if (!serviceType) {
      setSubmitError('Please select a service.');
      return;
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    // Get duration based on service type
    const duration = getServiceDuration(serviceType);

    const appointmentData: NewAppointmentData = {
      clientName: clientName.trim(),
      serviceType,
      startTime,
      duration,
      email: email.trim(),
      ...(technicianId && { artist: technicianId }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    onCreate(appointmentData);
    onClose();
  }, [clientName, serviceType, technicianId, date, time, email, phone, notes, getServiceDuration, onCreate, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
      {/* Backdrop */}
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />

      {/* Modal content */}
      <div ref={modalRef} className="modal-content large">
        {/* Colored header */}
        <div className={`modal-colored-header`}>
          <h2 id="create-modal-title">New Appointment</h2>
          <p>Fill in the details below to create a new booking</p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Client Name */}
          <div className="form-group">
            <label htmlFor="clientName" className="form-label">
              Client Name <span className="required">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client's full name"
              required
              className="form-input"
            />
          </div>

          {/* Technician - placed before Service Type so filtering works logically */}
          <div className="form-group">
            <label htmlFor="technician" className="form-label">Technician</label>
            <select
              id="technician"
              value={technicianId}
              onChange={(e) => handleTechnicianChange(e.target.value)}
              className="form-select"
            >
              <option value="">Select a technician (optional)</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div className="form-group">
            <label htmlFor="serviceType" className="form-label">
              Service <span className="required">*</span>
              {/* Show helper text when services are filtered by technician */}
              {technicianServices && technicianId && technicianServices[technicianId] && selectedTechnician && (
                <span className="form-helper-text" style={{ marginLeft: '0.5rem', marginTop: 0 }}>
                  ({availableServices.length} available for {selectedTechnician.name})
                </span>
              )}
            </label>
            {/* Services grouped by category */}
            {categories.map((category) => (
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
                        onClick={() => handleServiceChange(service.id)}
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
            <div className="form-grid" style={{ gap: '1rem' }}>
              <div>
                <label htmlFor="date" className="form-label">
                  Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="time" className="form-label">
                  Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
              className="form-input"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number (optional)</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="form-input"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
              className="form-textarea"
            />
          </div>

          {/* Actions */}
          {submitError && (
            <p className="form-error" role="alert" style={{ marginBottom: '0.75rem', color: 'var(--color-rose-600, #e11d48)' }}>
              {submitError}
            </p>
          )}
          <div className="btn-group">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CreateAppointmentModal;
