'use client'

import React, { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { themeManager, Theme, ResolvedTheme } from '@/src/lib/theme-manager'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(themeManager.getTheme())
    setResolvedTheme(themeManager.getResolvedTheme())

    const unsubscribe = themeManager.subscribe((newResolvedTheme) => {
      setResolvedTheme(newResolvedTheme)
    })

    return unsubscribe
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    themeManager.setTheme(newTheme)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="theme-toggle-placeholder" style={{ width: '140px', height: '40px' }} />
    )
  }

  return (
    <div className="theme-toggle-container">
      <div 
        className="theme-toggle"
        role="radiogroup"
        aria-label="Choose theme"
      >
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          role="radio"
          aria-checked={theme === 'light'}
          aria-label="Light theme"
          style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
        >
          <Sun size={18} />
          <span className="theme-label">Light</span>
        </button>
        
        <button
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => handleThemeChange('system')}
          role="radio"
          aria-checked={theme === 'system'}
          aria-label="System theme"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Monitor size={18} />
          <span className="theme-label">System</span>
        </button>
        
        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          role="radio"
          aria-checked={theme === 'dark'}
          aria-label="Dark theme"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Moon size={18} />
          <span className="theme-label">Dark</span>
        </button>
      </div>
      
      <style jsx>{`
        .theme-toggle-container {
          position: relative;
        }
        
        .theme-toggle {
          display: inline-flex;
          background-color: var(--surface-2);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        
        .theme-option {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-height: 44px;
          position: relative;
        }
        
        .theme-option:hover {
          color: var(--text-primary);
          background-color: var(--surface-3);
        }
        
        .theme-option.active {
          background-color: var(--accent-primary);
          color: white;
          box-shadow: 0 2px 8px rgba(147, 70, 255, 0.3);
        }
        
        .theme-option:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }
        
        .theme-label {
          display: none;
        }
        
        @media (min-width: 640px) {
          .theme-label {
            display: inline;
          }
        }
        
        /* Loading skeleton */
        .theme-toggle-placeholder {
          background: var(--surface-2);
          border-radius: 12px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}