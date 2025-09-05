"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      // Check for saved theme preference or default to light
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    } catch (error) {
      console.warn('Error loading theme:', error);
    }
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (error) {
      console.warn('Error saving theme:', error);
    }
  };

  // Always provide the context to avoid errors
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.error('useTheme called outside of ThemeProvider');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};