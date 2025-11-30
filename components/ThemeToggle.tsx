'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle Component
 * 
 * 3-button toggle for Light/Dark/System themes.
 * Includes active state styling and aria-pressed attributes.
 * 
 * Requirements: 2.1
 */

type ThemeValue = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeValue) => {
    setTheme(newTheme);
  };

  const buttons = [
    { value: 'light' as ThemeValue, icon: Sun, label: 'Light' },
    { value: 'dark' as ThemeValue, icon: Moon, label: 'Dark' },
    { value: 'system' as ThemeValue, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-theme-surface border border-theme-border rounded-lg">
      {buttons.map(({ value, icon: Icon, label }) => (
        <Button 
          key={value}
          variant="primary" 
          onClick={() => handleThemeChange(value)} 
          aria-pressed={theme === value}
          aria-label={`Switch to ${label} theme`}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md
            text-sm font-medium transition-all duration-200
            ${
              theme === value
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/50'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
