'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeManagerContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
  toggleTheme: () => void
  systemTheme: ResolvedTheme
}

const ThemeManagerContext = createContext<ThemeManagerContextType | undefined>(undefined)

export function ThemeManager({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Get stored theme preference
    const stored = localStorage.getItem('theme-preference') as Theme | null
    if (stored) {
      setThemeState(stored)
    }
    
    // Get system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
  }, [])

  // Apply theme to document
  const applyTheme = useCallback((isDark: boolean) => {
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add new theme class
    root.classList.add(isDark ? 'dark' : 'light')
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0F0F10' : '#FFFFFF')
    }
    
    // Enable smooth transitions after initial load
    if (document.readyState === 'complete') {
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    }
  }, [])

  // Update theme
  useEffect(() => {
    if (!mounted) return
    
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
    setResolvedTheme(isDark ? 'dark' : 'light')
    applyTheme(isDark)
    
    // Store preference
    localStorage.setItem('theme-preference', theme)
    
    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { theme, resolved: isDark ? 'dark' : 'light' } 
    }))
  }, [theme, systemTheme, mounted, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Listen for theme changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-preference' && e.newValue) {
        setThemeState(e.newValue as Theme)
      }
    }
    
    const handleCustomEvent = (e: Event) => {
      const { theme: newTheme } = (e as CustomEvent).detail
      if (newTheme !== theme) {
        setThemeState(newTheme)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('theme-change', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-change', handleCustomEvent)
    }
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, systemTheme, setTheme])

  // Prevent flash of incorrect theme
  if (!mounted) {
    return null
  }

  return (
    <ThemeManagerContext.Provider value={{ 
      theme, 
      setTheme, 
      resolvedTheme, 
      toggleTheme,
      systemTheme 
    }}>
      {children}
    </ThemeManagerContext.Provider>
  )
}

export function useThemeManager() {
  const context = useContext(ThemeManagerContext)
  if (!context) {
    throw new Error('useThemeManager must be used within a ThemeManager')
  }
  return context
}

// Utility hook for checking dark mode
export function useIsDarkMode() {
  const { resolvedTheme } = useThemeManager()
  return resolvedTheme === 'dark'
}