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
    const wouldExceedMaxDays = (date: Date): boolean => {
        if (!rangeStart || rangeEnd) return false;
        const diff = Math.abs(date.getTime() - rangeStart.getTime());
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        return days > maxRangeDays;
    };

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
                // Complete the range
                if (wouldExceedMaxDays(date)) return;

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
        const classes = ['w-9 h-9 text-sm rounded-lg transition-all duration-150 font-medium'];

        const isSelected = mode === 'single'
            ? isSameDay(date, selectedDate)
            : isSameDay(date, rangeStart) || isSameDay(date, rangeEnd);

        const inRange = mode === 'range' && isInRange(date);
        const isDisabled = mode === 'range' && !rangeEnd && wouldExceedMaxDays(date);

        if (isDisabled) {
            classes.push('text-stone-300 cursor-not-allowed');
        } else if (isSelected) {
            classes.push('bg-rose-500 text-white shadow-md hover:bg-rose-600');
        } else if (inRange) {
            classes.push('bg-rose-100 text-rose-700 hover:bg-rose-200');
        } else if (isToday(date)) {
            classes.push('bg-stone-100 text-stone-900 font-semibold hover:bg-stone-200');
        } else {
            classes.push('text-stone-700 hover:bg-stone-100');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-stone-100 bg-gradient-to-b from-stone-50 to-white">
                    <h2 className="text-lg font-semibold text-stone-800">
                        {mode === 'single' ? 'Select Date' : 'Select Date Range'}
                    </h2>
                    <p className="text-sm text-stone-500 mt-0.5">
                        {mode === 'single'
                            ? 'Choose a date to view'
                            : `Select up to ${maxRangeDays} days`}
                    </p>
                </div>

                {/* Calendar */}
                <div className="p-4">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={goToPreviousMonth}
                            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-semibold text-stone-800">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={goToNextMonth}
                            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="w-9 h-8 flex items-center justify-center text-xs font-semibold text-stone-400 uppercase tracking-wide">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
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
                                <div key={`empty-${index}`} className="w-9 h-9" />
                            )
                        ))}
                    </div>

                    {/* Range info */}
                    {mode === 'range' && (
                        <div className="mt-4 text-center text-sm text-stone-500">
                            {rangeInfo}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleGoToToday}
                        className="px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isConfirmDisabled}
                            className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
