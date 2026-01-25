# Dark/Light Theme Implementation

This scheduler package now includes a comprehensive dark/light theme toggle system using pure CSS/SCSS (no Tailwind).

## Features

### 🎨 Theme Toggle Component
- **Automatic Detection**: Detects system color scheme preference on first load
- **Persistent Storage**: Saves theme preference to localStorage
- **Smooth Transitions**: All color changes animate smoothly (200ms ease-out)
- **Accessible**: Proper ARIA labels and keyboard support

### 🌓 Theme Modes

#### Light Mode (Default)
- Clean, bright interface with soft gray backgrounds
- High contrast for readability
- Traditional professional appearance

#### Dark Mode
- Deep, rich dark backgrounds (#1c1917)
- Reduced eye strain in low-light environments
- Modern, sleek appearance
- Optimized shadows for depth in dark UI

## Usage

### Basic Implementation

```tsx
import { ThemeToggle } from 'react-appointment-scheduler';
import { initializeTheme } from 'react-appointment-scheduler';

function App() {
  // Initialize theme on app mount
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <div>
      {/* Add theme toggle button anywhere in your app */}
      <ThemeToggle />
      
      {/* Your scheduler and other components */}
      <Scheduler {...props} />
    </div>
  );
}
```

### With Custom Styling

```tsx
<ThemeToggle className="my-custom-theme-toggle" />
```

### Programmatic Theme Control

```tsx
import { getCurrentTheme, setTheme, toggleTheme } from 'react-appointment-scheduler';

// Get current theme
const currentTheme = getCurrentTheme(); // 'light' | 'dark'

// Set specific theme
setTheme('dark');
setTheme('light');

// Toggle between themes
const newTheme = toggleTheme();
```

## CSS Variables

The theme system uses CSS custom properties that automatically switch based on the `data-theme` attribute on the document root.

### Theme-Aware Variables

```css
/* These variables automatically change with theme */
--scheduler-bg-primary: white (light) / #1c1917 (dark)
--scheduler-bg-secondary: #fafaf9 (light) / #292524 (dark)
--scheduler-text-primary: #1c1917 (light) / #fafaf9 (dark)
--scheduler-text-secondary: #44403c (light) / #e7e5e4 (dark)
--scheduler-text-tertiary: #78716c (light) / #a8a29e (dark)
--scheduler-border-primary: #e7e5e4 (light) / #44403c (dark)
--scheduler-border-secondary: #d6d3d1 (light) / #57534e (dark)
--scheduler-border-tertiary: #a8a29e (light) / #78716c (dark)
```

### Custom Component Styling

If you want to create custom components that respect the theme:

```css
.my-custom-component {
  background-color: var(--scheduler-bg-primary);
  color: var(--scheduler-text-primary);
  border: 1px solid var(--scheduler-border-primary);
}
```

## Architecture

### File Structure

```
src/
├── components/
│   └── Scheduler/
│       ├── ThemeToggle.tsx       # Theme toggle component
│       └── styles.css             # Theme-aware styles
├── utils/
│   └── themeUtils.ts              # Theme utility functions
```

### How It Works

1. **Theme Detection**: On first load, checks localStorage, then system preference
2. **Storage**: Theme preference saved to `localStorage.getItem('scheduler-theme')`
3. **Application**: Theme applied via `data-theme` attribute on `<html>` element
4. **CSS Variables**: All colors use CSS custom properties that change with theme
5. **Transitions**: Smooth 200ms transitions on all color properties

### Browser Support

- Modern browsers with CSS custom properties support
- Fallback to light mode for older browsers
- localStorage API required for persistence
- **SSR Compatible**: Safe to use in Next.js, Remix, and other SSR frameworks

## Customization

### Changing Theme Colors

Edit `src/components/Scheduler/styles.css`:

```css
/* Light mode colors */
:root {
  --scheduler-bg-primary: #ffffff;
  /* ... other light mode colors */
}

/* Dark mode colors */
:root[data-theme="dark"] {
  --scheduler-bg-primary: #1c1917;
  /* ... other dark mode colors */
}
```

### Custom Theme Toggle Button

```tsx
import { toggleTheme, getCurrentTheme } from 'react-appointment-scheduler';

function CustomThemeToggle() {
  const [theme, setThemeState] = useState(getCurrentTheme());
  
  const handleToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };
  
  return (
    <button onClick={handleToggle}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

## Best Practices

1. **Initialize Early**: Call `initializeTheme()` as early as possible to prevent flash
2. **Single Toggle**: Use one ThemeToggle component per app
3. **Consistent Colors**: Always use theme variables instead of hardcoded colors
4. **Test Both Modes**: Test all UI states in both light and dark mode
5. **Accessibility**: Maintain sufficient contrast ratios in both themes

## Examples

### Header with Theme Toggle

```tsx
<header className="app-header">
  <h1>My App</h1>
  <div className="controls">
    <ThemeToggle />
    {/* other controls */}
  </div>
</header>
```

### With Multiple Schedulers

```tsx
// Initialize once at app level
function App() {
  useEffect(() => {
    initializeTheme();
  }, []);
  
  return (
    <>
      <ThemeToggle />
      <Scheduler {...propsA} />
      <Scheduler {...propsB} />
    </>
  );
}
```

## Server-Side Rendering (SSR)

The theme system is fully compatible with SSR frameworks like Next.js, Remix, and others.

### Next.js Usage

```tsx
'use client'; // Required for client-side features

import { ThemeToggle } from 'react-appointment-scheduler';
import { initializeTheme } from 'react-appointment-scheduler';
import { useEffect } from 'react';

export function MyComponent() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <div>
      <ThemeToggle />
      <Scheduler {...props} />
    </div>
  );
}
```

### How It Works

- All `localStorage` and `window` access is protected with environment checks
- Theme defaults to `light` during SSR
- Theme is hydrated on the client after mount
- No flash of unstyled content (FOUC) issues

## Troubleshooting

### Theme Not Persisting
- Check localStorage is enabled in browser
- Verify `initializeTheme()` is called on app mount

### Flash of Wrong Theme
- Call `initializeTheme()` earlier in component lifecycle
- Consider SSR hydration: theme loads client-side after initial render

### "localStorage is not defined" Error
- This error should no longer occur (fixed in v1.1.2+)
- If you see this, ensure you're using the latest version
- The package now includes SSR safety checks

### Custom Styles Not Respecting Theme
- Use CSS variables instead of hardcoded colors
- Check specificity of CSS selectors

## Migration Guide

If upgrading from a previous version:

1. Import theme utilities:
   ```tsx
   import { ThemeToggle, initializeTheme } from 'react-appointment-scheduler';
   ```

2. Add theme initialization:
   ```tsx
   useEffect(() => {
     initializeTheme();
   }, []);
   ```

3. Add theme toggle button:
   ```tsx
   <ThemeToggle />
   ```

That's it! Your scheduler will now support dark/light themes.
