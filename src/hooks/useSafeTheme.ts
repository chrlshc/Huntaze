"use client";

import { useContext } from 'react';
import { ThemeContext } from '@/src/contexts/ThemeContext';

// Safe version of useTheme that doesn't throw errors
export const useSafeTheme = () => {
  const context = useContext(ThemeContext);
  
  // Return default values if context is not available
  if (!context) {
    return {
      theme: 'light' as const,
      toggleTheme: () => {
        console.warn('toggleTheme called before ThemeProvider is ready');
      }
    };
  }
  
  return context;
};