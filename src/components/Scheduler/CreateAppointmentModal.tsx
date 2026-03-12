import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ServiceType, NewAppointmentData, TechnicianServices, Service, Technician, Job } from '../../types/scheduler';

/**
 * CreateAppointmentModal Component
 * 
 * A modal for creating new appointments with form fields for:
 * - Client name
 * - Jobs (each job = service + technician pair)
 * - Start time
 * - Email (optional)
 * - Phone (required)
 * - Notes (optional)
 */

/** Internal type for a job entry in the builder */
interface JobEntry {
  serviceId: ServiceType;
  technicianId: string;
  key: string;
}

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
   * When provided, technician dropdown in the job builder will be
   * filtered based on the selected service.
   */
  technicianServices?: TechnicianServices;
}

export const CreateAppointmentModal = memo(function CreateAppointmentModal({
  isOpen,
  onClose,
  onCreate,
  initialStartTime,
  initialEndTime: _initialEndTime,
  initialTechnicianId,
  technicians = [],
  services,
  technicianServices,
}: CreateAppointmentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Jobs list - each job is a (service, technician) pair
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  
  // Job builder state
  const [builderServiceId, setBuilderServiceId] = useState<ServiceType>('');
  const [builderTechnicianId, setBuilderTechnicianId] = useState<string>('');

  // Services available for the currently selected builder technician
  // If no tech selected or no technicianServices map, show all services
  const builderAvailableServices = useMemo(() => {
    if (!builderTechnicianId || !technicianServices) return services;
    const allowedServiceIds = technicianServices[builderTechnicianId];
    if (!allowedServiceIds) return services;
    return services.filter(s => allowedServiceIds.includes(s.id));
  }, [builderTechnicianId, technicianServices, services]);

  // Group available services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    builderAvailableServices.forEach((service) => {
      const categoryKey =
        typeof service.category === 'string'
          ? service.category
          : (service.category?.name ?? 'Uncategorized');
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(service);
    });
    return grouped;
  }, [builderAvailableServices]);

  const categories = useMemo(() => Object.keys(servicesByCategory), [servicesByCategory]);

  // Reverse map: service ID → technician IDs who can perform it
  const techniciansByService = useMemo(() => {
    if (!technicianServices) return {};
    const map: Record<string, string[]> = {};
    for (const [techId, serviceIds] of Object.entries(technicianServices)) {
      for (const serviceId of serviceIds) {
        if (!map[serviceId]) map[serviceId] = [];
        map[serviceId].push(techId);
      }
    }
    return map;
  }, [technicianServices]);

  // Technicians available for the currently selected builder service
  const builderAvailableTechnicians = useMemo(() => {
    if (!builderServiceId || !techniciansByService[builderServiceId]) {
      return technicians;
    }
    const availTechIds = techniciansByService[builderServiceId];
    return technicians.filter(t => availTechIds.includes(t.id));
  }, [builderServiceId, techniciansByService, technicians]);

  // Get duration for a service (uses actual value, falls back to 0 if not set)
  const getServiceDuration = useCallback((serviceId: ServiceType): number => {
    const service = services.find(s => s.id === serviceId);
    return service?.duration ?? 0;
  }, [services]);

  // Total duration from all jobs
  const totalDuration = useMemo(() => {
    return jobs.reduce((sum, job) => sum + getServiceDuration(job.serviceId), 0);
  }, [jobs, getServiceDuration]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setSubmitError('');
      setJobs([]);
      setBuilderServiceId('');
      setBuilderTechnicianId(initialTechnicianId || '');

      if (initialStartTime) {
        const year = initialStartTime.getFullYear();
        const month = String(initialStartTime.getMonth() + 1).padStart(2, '0');
        const day = String(initialStartTime.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        const hours = String(initialStartTime.getHours()).padStart(2, '0');
        const minutes = String(initialStartTime.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        const nextHour = (now.getHours() + 1) % 24;
        setTime(`${String(nextHour).padStart(2, '0')}:00`);
      }
    }
  }, [isOpen, initialStartTime, initialTechnicianId]);

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

  // When builder service changes, reset technician if they can't do the new service
  const handleBuilderServiceChange = useCallback((newServiceId: ServiceType) => {
    setBuilderServiceId(newServiceId);
    if (technicianServices && builderTechnicianId && newServiceId) {
      const techsForService = techniciansByService[newServiceId];
      if (techsForService && !techsForService.includes(builderTechnicianId)) {
        setBuilderTechnicianId('');
      }
    }
  }, [technicianServices, builderTechnicianId, techniciansByService]);

  // When builder technician changes, reset service if the tech can't perform it
  const handleBuilderTechnicianChange = useCallback((newTechId: string) => {
    setBuilderTechnicianId(newTechId);
    if (technicianServices && builderServiceId && newTechId) {
      const allowedServiceIds = technicianServices[newTechId];
      if (allowedServiceIds && !allowedServiceIds.includes(builderServiceId)) {
        setBuilderServiceId('');
      }
    }
  }, [technicianServices, builderServiceId]);

  // Add a job from the builder
  const handleAddJob = useCallback(() => {
    if (!builderServiceId) return;
    setJobs(prev => [...prev, {
      serviceId: builderServiceId,
      technicianId: builderTechnicianId,
      key: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }]);
    setBuilderServiceId('');
    setBuilderTechnicianId(initialTechnicianId || '');
  }, [builderServiceId, builderTechnicianId, initialTechnicianId]);

  // Remove a job by key
  const handleRemoveJob = useCallback((key: string) => {
    setJobs(prev => prev.filter(j => j.key !== key));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!clientName.trim() || !date || !time || !phone.trim()) {
      setSubmitError('Please fill in all required fields (client name, date, time, and phone number).');
      return;
    }

    if (jobs.length === 0) {
      setSubmitError('Please add at least one job (service).');
      return;
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    // Build jobs array
    const jobsData: Job[] = jobs.map(j => ({
      serviceType: j.serviceId,
      ...(j.technicianId && { technicianId: j.technicianId }),
    }));

    const appointmentData: NewAppointmentData = {
      client: { name: clientName.trim(), path: '' },
      jobs: jobsData,
      startTime,
      duration: totalDuration,
      phone: phone.trim(),
      ...(email.trim() && { email: email.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    onCreate(appointmentData);
    onClose();
  }, [clientName, jobs, date, time, email, phone, notes, totalDuration, onCreate, onClose]);

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

          {/* Jobs - each job is a service + technician pair */}
          <div className="form-group">
            <label className="form-label">
              Jobs <span className="required">*</span>
            </label>

            {/* Added jobs list */}
            {jobs.length > 0 && (
              <div className="jobs-list">
                {jobs.map((job, index) => {
                  const service = services.find(s => s.id === job.serviceId);
                  const tech = technicians.find(t => t.id === job.technicianId);
                  const duration = service?.duration;
                  return (
                    <div key={job.key} className="job-entry">
                      <span className="job-entry-number">{index + 1}</span>
                      <div className="job-entry-info">
                        <span className="job-entry-service">
                          {service?.name ?? job.serviceId}
                        </span>
                        {tech && (
                          <span className="job-entry-tech">by {tech.name}</span>
                        )}
                      </div>
                      {duration != null && duration > 0 && (
                        <span className="job-entry-duration">{duration} min</span>
                      )}
                      <button
                        type="button"
                        className="job-entry-remove"
                        onClick={() => handleRemoveJob(job.key)}
                        aria-label={`Remove job ${index + 1}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                <div className="jobs-summary">
                  <span>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
                  {totalDuration > 0 && (
                    <span className="jobs-summary-duration">{totalDuration} min total</span>
                  )}
                </div>
              </div>
            )}

            {/* Job builder row */}
            <div className="job-builder">
              <div className="job-builder-fields">
                <select
                  value={builderServiceId}
                  onChange={(e) => handleBuilderServiceChange(e.target.value)}
                  className="form-select"
                  aria-label="Select a service"
                >
                  <option value="">Select a service...</option>
                  {categories.map((category) => (
                    <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                      {servicesByCategory[category].map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}{service.duration != null ? ` (${service.duration} min)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <select
                  value={builderTechnicianId}
                  onChange={(e) => handleBuilderTechnicianChange(e.target.value)}
                  className="form-select"
                  aria-label="Select a technician"
                >
                  <option value="">Technician (optional)</option>
                  {builderAvailableTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddJob}
                className="btn btn-outline job-builder-add-btn"
                disabled={!builderServiceId}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            </div>
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
            <label htmlFor="email" className="form-label">Email (optional)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="form-input"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              required
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
