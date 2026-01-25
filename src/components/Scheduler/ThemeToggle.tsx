import { useEffect, useState } from 'react';

/**
 * ThemeToggle Component
 * 
 * A toggle button for switching between light and dark themes.
 * Persists the user's preference in localStorage.
 */

export interface ThemeToggleProps {
    /** Optional className for custom styling */
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Initialize theme on mount (client-side only)
    useEffect(() => {
        setMounted(true);

        // Check localStorage first
        if (typeof localStorage !== 'undefined') {
            const savedTheme = localStorage.getItem('scheduler-theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                setTheme(savedTheme);
                return;
            }
        }

        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme to document root
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Save to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('scheduler-theme', theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`theme-toggle ${className}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                // Moon icon for dark mode
                <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            ) : (
                // Sun icon for light mode
                <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            )}
        </button>
    );
}
