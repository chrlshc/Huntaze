'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContext and Provider
 * 
 * Manages theme state (light/dark/system) with:
 * - localStorage persistence
 * - OS preference detection via matchMedia
 * - Automatic updates when OS preference changes
 * 
 * Requirements: 2.1, 2.2, 2.6, 2.7
 */

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Get OS preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Resolve theme (system -> light/dark)
  const resolveTheme = (themeValue: Theme): ResolvedTheme => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  };

  // Apply theme to document
  const applyTheme = (resolved: ResolvedTheme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (resolved === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
    
    setResolvedTheme(resolved);
  };

  // Initialize hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize theme from localStorage (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored);
        applyTheme(resolveTheme(stored));
      } else {
        // Default to system
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
      applyTheme('light');
    }
  }, [isHydrated]);

  // Listen for OS preference changes
  useEffect(() => {
    if (!isHydrated || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, isHydrated]);

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    if (!isHydrated) return;
    
    try {
      setThemeState(newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      applyTheme(resolveTheme(newTheme));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
