# Changelog

## [1.1.2] - 2026-01-24

### Fixed
- **SSR Compatibility**: Fixed `localStorage is not defined` error when using the package in server-side rendering environments (Next.js, Remix, etc.)
  - Added environment checks for `localStorage`, `window`, and `document` access
  - Theme system now gracefully defaults to light mode during SSR
  - Theme hydrates properly on client-side after mount
  
### Changed
- Updated `ThemeToggle` component to use `useEffect` for client-side initialization
- Modified theme utility functions to check for browser environment before accessing Web APIs
- Added SSR usage documentation in `THEME_DOCS.md`

### Technical Details
The following changes were made to ensure SSR compatibility:

**themeUtils.ts:**
- Added `isBrowser` constant to check for browser environment
- `getCurrentTheme()` returns 'light' when not in browser
- `setTheme()` safely exits when not in browser

**ThemeToggle.tsx:**
- Removed direct `localStorage` access from state initializer
- Added `mounted` state to track client-side hydration
- Theme initialization moved to `useEffect` hook

## [1.1.1] - Previous Release
- Theme toggle functionality
- Dark/light mode support
- CSS variable-based theming
