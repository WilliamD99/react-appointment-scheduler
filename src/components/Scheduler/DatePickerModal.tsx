import { useState, useCallback, useMemo, useEffect } from 'react';

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'single' | 'range';
    initialDate?: Date;
    initialEndDate?: Date;
    maxRangeDays?: number;
    onSelectDate?: (date: Date) => void;
    onSelectRange?: (startDate: Date, endDate: Date) => void;
}

/**
 * DatePickerModal Component
 * 
 * A modal dialog for selecting dates.
 * - In 'single' mode: select a single date
 * - In 'range' mode: select a date range (max 7 days by default)
 */
export function DatePickerModal({
    isOpen,
    onClose,
    mode,
    initialDate,
    initialEndDate,
    maxRangeDays = 7,
    onSelectDate,
    onSelectRange,
}: DatePickerModalProps) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = initialDate ?? new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });

    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? null);
    const [rangeStart, setRangeStart] = useState<Date | null>(initialDate ?? null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEndDate ?? null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const date = initialDate ?? new Date();
            setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            setSelectedDate(initialDate ?? null);
            setRangeStart(initialDate ?? null);
            setRangeEnd(initialEndDate ?? null);
            setHoverDate(null);
        }
    }, [isOpen, initialDate, initialEndDate]);

    // Get days in month
    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Add empty slots for days before the first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [currentMonth]);

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    // Format month/year label
    const monthLabel = useMemo(() => {
        return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [currentMonth]);

    // Check if two dates are the same day
    const isSameDay = (a: Date | null, b: Date | null): boolean => {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    };

    // Check if date is in range
    const isInRange = (date: Date): boolean => {
        if (!rangeStart) return false;
        const end = rangeEnd ?? hoverDate;
        if (!end) return false;

        const start = rangeStart < end ? rangeStart : end;
        const finish = rangeStart < end ? end : rangeStart;

        return date >= start && date <= finish;
    };

    // Check if date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return isSameDay(date, today);
    };

    // Check if range would exceed max days
    const wouldExceedMaxDays = useCallback((date: Date): boolean => {
        if (!rangeStart || rangeEnd) return false;
        const diff = Math.abs(date.getTime() - rangeStart.getTime());
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        return days > maxRangeDays;
    }, [rangeStart, rangeEnd, maxRangeDays]);

    // Handle day click
    const handleDayClick = useCallback((date: Date) => {
        if (mode === 'single') {
            setSelectedDate(date);
        } else {
            // Range mode
            if (!rangeStart || rangeEnd) {
                // Start new selection
                setRangeStart(date);
                setRangeEnd(null);
            } else {
                // Complete the range - check max days inline
                const diff = Math.abs(date.getTime() - rangeStart.getTime());
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
                if (days > maxRangeDays) return;

                if (date < rangeStart) {
                    setRangeEnd(rangeStart);
                    setRangeStart(date);
                } else {
                    setRangeEnd(date);
                }
            }
        }
    }, [mode, rangeStart, rangeEnd, maxRangeDays]);

    // Handle confirm
    const handleConfirm = useCallback(() => {
        if (mode === 'single' && selectedDate && onSelectDate) {
            onSelectDate(selectedDate);
            onClose();
        } else if (mode === 'range' && rangeStart && onSelectRange) {
            const end = rangeEnd ?? rangeStart;
            onSelectRange(
                rangeStart < end ? rangeStart : end,
                rangeStart < end ? end : rangeStart
            );
            onClose();
        }
    }, [mode, selectedDate, rangeStart, rangeEnd, onSelectDate, onSelectRange, onClose]);

    // Handle go to today
    const handleGoToToday = useCallback(() => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        if (mode === 'single') {
            setSelectedDate(today);
        } else {
            setRangeStart(today);
            setRangeEnd(null);
        }
    }, [mode]);

    // Get day cell classes
    const getDayClasses = (date: Date): string => {
        const classes = ['datepicker-day'];

        const isSelected = mode === 'single'
            ? isSameDay(date, selectedDate)
            : isSameDay(date, rangeStart) || isSameDay(date, rangeEnd);

        const inRange = mode === 'range' && isInRange(date);
        const isDisabled = mode === 'range' && !rangeEnd && wouldExceedMaxDays(date);

        if (isDisabled) {
            classes.push('disabled');
        } else if (isSelected) {
            classes.push('selected');
        } else if (inRange) {
            classes.push('in-range');
        } else if (isToday(date)) {
            classes.push('today');
        }

        return classes.join(' ');
    };

    // Calculate range info text
    const rangeInfo = useMemo(() => {
        if (mode !== 'range') return null;

        if (rangeStart && rangeEnd) {
            const diff = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return `${diff} day${diff > 1 ? 's' : ''} selected`;
        } else if (rangeStart) {
            return `Select end date (max ${maxRangeDays} days)`;
        }
        return 'Select start date';
    }, [mode, rangeStart, rangeEnd, maxRangeDays]);

    if (!isOpen) return null;

    const isConfirmDisabled = mode === 'single'
        ? !selectedDate
        : !rangeStart;

    return (
        <div className="modal-backdrop">
            {/* Backdrop */}
            <div className="modal-overlay" onClick={onClose} />

            {/* Modal */}
            <div className="datepicker-modal">
                {/* Header */}
                <div className="datepicker-header">
                    <h2 className="datepicker-title">
                        {mode === 'single' ? 'Select Date' : 'Select Date Range'}
                    </h2>
                    <p className="datepicker-subtitle">
                        {mode === 'single'
                            ? 'Choose a date to view'
                            : `Select up to ${maxRangeDays} days`}
                    </p>
                </div>

                {/* Calendar */}
                <div className="datepicker-calendar">
                    {/* Month navigation */}
                    <div className="datepicker-nav">
                        <button type="button" onClick={goToPreviousMonth} className="datepicker-nav-btn">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="datepicker-month-label">{monthLabel}</span>
                        <button type="button" onClick={goToNextMonth} className="datepicker-nav-btn">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="datepicker-weekdays">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="datepicker-weekday">{day}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="datepicker-days">
                        {daysInMonth.map((date, index) => (
                            date ? (
                                <button
                                    key={date.toISOString()}
                                    type="button"
                                    onClick={() => handleDayClick(date)}
                                    onMouseEnter={() => setHoverDate(date)}
                                    onMouseLeave={() => setHoverDate(null)}
                                    disabled={mode === 'range' && !rangeEnd && wouldExceedMaxDays(date)}
                                    className={getDayClasses(date)}
                                >
                                    {date.getDate()}
                                </button>
                            ) : (
                                <div key={`empty-${index}`} className="datepicker-day-empty" />
                            )
                        ))}
                    </div>

                    {/* Range info */}
                    {mode === 'range' && (
                        <div className="datepicker-range-info">{rangeInfo}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="datepicker-footer">
                    <button type="button" onClick={handleGoToToday} className="btn btn-ghost">
                        Today
                    </button>
                    <div className="datepicker-footer-actions">
                        <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isConfirmDisabled}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DatePickerModal;
