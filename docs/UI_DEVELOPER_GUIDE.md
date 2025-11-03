# UI Enhancements - Developer Guide

Complete developer guide for working with UI Enhancement components in the Huntaze application.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [Animation Patterns](#animation-patterns)
4. [Responsive Utilities](#responsive-utilities)
5. [Theme System](#theme-system)
6. [Best Practices](#best-practices)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Dependencies

```json
{
  "framer-motion": "^11.0.0",
  "chart.js": "^4.0.0",
  "react-chartjs-2": "^5.0.0",
  "react-swipeable": "^7.0.0",
  "lucide-react": "^0.263.0"
}
```

### Installation

```bash
npm install framer-motion chart.js react-chartjs-2 react-swipeable lucide-react
```

### Project Structure

```
huntaze/
├── app/
│   ├── dashboard/          # Dashboard pages
│   ├── demo/              # Demo pages for components
│   └── page.tsx           # Landing page
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── landing/           # Landing page components
│   ├── mobile/            # Mobile-specific components
│   ├── ui/                # Reusable UI components
│   ├── animations/        # Animation components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── contexts/
│   └── ThemeContext.tsx   # Theme management
├── hooks/
│   └── useReducedMotion.ts
├── lib/
│   ├── animations/        # Animation utilities
│   └── config/            # Configuration files
└── docs/                  # Documentation
```

---

## Architecture

### Component Hierarchy

```
App
├── ThemeProvider (Context)
│   ├── AppShell (Layout + Animations)
│   │   ├── Header
│   │   │   └── ThemeToggle
│   │   ├── Page Content
│   │   │   ├── Dashboard
│   │   │   │   ├── StatsOverview
│   │   │   │   ├── ActivityFeed
│   │   │   │   ├── QuickActions
│   │   │   │   └── PerformanceCharts
│   │   │   └── Landing
│   │   │       ├── HeroSection
│   │   │       ├── FeaturesShowcase
│   │   │       ├── SocialProof
│   │   │       ├── PricingSection
│   │   │       ├── FAQSection
│   │   │       └── FinalCTA
│   │   └── BottomNav (Mobile only)
│   └── Footer
```

### Data Flow

```
User Action → Component → Context/State → Re-render → Animation
```

### State Management

- **Theme**: Context API (`ThemeContext`)
- **Component State**: React useState
- **Animation State**: Framer Motion internal state
- **Form State**: React Hook Form (where applicable)

---

## Animation Patterns

### Basic Animation

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Stagger Animation

```tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.li key={item.id} variants={item}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

### Scroll Reveal

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.6 }}
>
  Content reveals on scroll
</motion.div>
```

### Hover & Tap Interactions

```tsx
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Modal Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      Modal content
    </motion.div>
  )}
</AnimatePresence>
```

### Page Transitions

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Reduced Motion Support

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.1 }}
    >
      Content
    </motion.div>
  );
}
```

### Animation Performance Tips

1. **Use GPU-accelerated properties**:
   ```tsx
   // Good: transform, opacity
   <motion.div animate={{ x: 100, opacity: 0.5 }} />
   
   // Avoid: width, height, top, left
   <motion.div animate={{ width: 100 }} /> // Causes reflow
   ```

2. **Use `will-change` sparingly**:
   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

3. **Optimize list animations**:
   ```tsx
   // Use layout animations for smooth reordering
   <motion.li layout>Item</motion.li>
   ```

---

## Responsive Utilities

### Breakpoints

```typescript
// tailwind.config.mjs
export default {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    }
  }
}
```

### Responsive Classes

```tsx
// Mobile-first approach
<div className="
  w-full           // Mobile: full width
  md:w-1/2         // Tablet: half width
  lg:w-1/3         // Desktop: third width
  p-4              // Mobile: padding 16px
  md:p-6           // Tablet: padding 24px
  lg:p-8           // Desktop: padding 32px
">
  Content
</div>
```

### Responsive Components

```tsx
'use client';

import { useState, useEffect } from 'react';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

### Responsive Tables

```tsx
// Automatically converts to cards on mobile
<table className="responsive-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">John</td>
      <td data-label="Email">john@example.com</td>
    </tr>
  </tbody>
</table>
```

```css
/* globals.css */
@media (max-width: 767px) {
  .responsive-table thead {
    display: none;
  }
  
  .responsive-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  
  .responsive-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
  }
  
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 600;
  }
}
```

---

## Theme System

### Theme Context

```typescript
// contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Resolve theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### CSS Variables

```css
/* globals.css */
:root {
  /* Light theme */
  --bg: #ffffff;
  --surface: #ffffff;
  --text: #111111;
  --text-muted: #666666;
  --border: #E5E7EB;
  --primary: #3B82F6;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  
  color-scheme: light dark;
}

[data-theme="dark"] {
  /* Dark theme */
  --bg: #1A1A1A;
  --surface: #1F1F1F;
  --text: #EDEDED;
  --text-muted: #A1A1AA;
  --border: #2A2A2A;
  --primary: #3B82F6;
  --shadow: none;
}

* {
  transition: background-color 200ms, color 200ms, border-color 200ms;
}
```

### Using Theme in Components

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-[#1A1A1A]">
      <p className="text-gray-900 dark:text-white">
        Current theme: {resolvedTheme}
      </p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

---

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should do one thing well
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Always define TypeScript interfaces
4. **Default Props**: Provide sensible defaults

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Performance

1. **Memoization**: Use React.memo for expensive components
   ```tsx
   export const ExpensiveComponent = React.memo(function ExpensiveComponent(props) {
     // Component logic
   });
   ```

2. **Lazy Loading**: Code split large components
   ```tsx
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />
   });
   ```

3. **Virtualization**: For long lists
   ```tsx
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={600}
     itemCount={1000}
     itemSize={50}
   >
     {Row}
   </FixedSizeList>
   ```

### Accessibility

1. **Semantic HTML**: Use proper HTML elements
   ```tsx
   // Good
   <button onClick={handleClick}>Click</button>
   
   // Bad
   <div onClick={handleClick}>Click</div>
   ```

2. **ARIA Labels**: Add labels for screen readers
   ```tsx
   <button aria-label="Close modal" onClick={onClose}>
     <X />
   </button>
   ```

3. **Keyboard Navigation**: Support keyboard users
   ```tsx
   <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => e.key === 'Enter' && handleClick()}
     onClick={handleClick}
   >
     Clickable div
   </div>
   ```

4. **Focus Management**: Manage focus for modals
   ```tsx
   useEffect(() => {
     if (isOpen) {
       const firstFocusable = modalRef.current?.querySelector('button');
       firstFocusable?.focus();
     }
   }, [isOpen]);
   ```

### Code Style

1. **Naming Conventions**:
   - Components: PascalCase (`MyComponent`)
   - Functions: camelCase (`handleClick`)
   - Constants: UPPER_SNAKE_CASE (`MAX_ITEMS`)
   - CSS classes: kebab-case (`my-class`)

2. **File Organization**:
   ```
   MyComponent/
   ├── index.tsx          # Component export
   ├── MyComponent.tsx    # Component logic
   ├── MyComponent.test.tsx
   └── types.ts           # Type definitions
   ```

3. **Import Order**:
   ```tsx
   // 1. React
   import React, { useState } from 'react';
   
   // 2. External libraries
   import { motion } from 'framer-motion';
   
   // 3. Internal components
   import { Button } from '@/components/ui/Button';
   
   // 4. Utilities
   import { cn } from '@/lib/utils';
   
   // 5. Types
   import type { MyType } from './types';
   
   // 6. Styles
   import './styles.css';
   ```

---

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('loads and displays stats', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Fans')).toBeInTheDocument();
    });
  });
});
```

### Animation Tests

```tsx
import { render } from '@testing-library/react';
import { AnimatedComponent } from './AnimatedComponent';

describe('AnimatedComponent', () => {
  it('respects reduced motion', () => {
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { container } = render(<AnimatedComponent />);
    // Assert no animations
  });
});
```

---

## Troubleshooting

### Common Issues

**Animations not working**
- Check if Framer Motion is installed
- Verify `'use client'` directive in Next.js
- Check for CSS conflicts

**Theme not persisting**
- Check localStorage permissions
- Verify ThemeProvider is wrapping app
- Check for SSR issues

**Mobile layout issues**
- Test on real devices
- Check viewport meta tag
- Verify responsive classes

**Performance issues**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize images and assets

### Debug Tools

```tsx
// Debug component renders
useEffect(() => {
  console.log('Component rendered', props);
});

// Debug animations
<motion.div
  animate={{ x: 100 }}
  onAnimationStart={() => console.log('Animation started')}
  onAnimationComplete={() => console.log('Animation complete')}
/>
```

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: November 2, 2024  
**Version**: 1.0.0  
**Maintainer**: Huntaze Dev Team
