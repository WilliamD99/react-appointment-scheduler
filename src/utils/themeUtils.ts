/**
 * Theme Utilities
 * 
 * Helper functions for theme management
 */

export type Theme = 'light' | 'dark';

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Get the current theme from localStorage or system preference
 */
export function getCurrentTheme(): Theme {
    if (!isBrowser) {
        return 'light'; // Default to light theme on server-side
    }

    const savedTheme = localStorage.getItem('scheduler-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

/**
 * Set the theme and persist to localStorage
 */
export function setTheme(theme: Theme): void {
    if (!isBrowser) {
        return; // Skip on server-side
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('scheduler-theme', theme);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme(): Theme {
    const current = getCurrentTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    return newTheme;
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): void {
    const theme = getCurrentTheme();
    setTheme(theme);
}
