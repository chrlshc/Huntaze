'use client'

import { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from 'react'

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
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    try {
      return (localStorage.getItem('theme-preference') as Theme | null) || 'system'
    } catch {
      return 'system'
    }
  })

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const systemTheme = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {}
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => callback()
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
      }
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    },
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    () => 'light'
  )
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme

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
      metaThemeColor.setAttribute('content', isDark ? 'var(--bg-primary)' : '#FFFFFF')
    }
    
    // Enable smooth transitions after initial load
    if (document.readyState === 'complete') {
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    }
  }, [])

  // Update theme
  useEffect(() => {
    if (!isClient) return
    const isDark = resolvedTheme === 'dark'
    applyTheme(isDark)

    // Store preference
    localStorage.setItem('theme-preference', theme)

    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { theme, resolved: resolvedTheme } 
    }))
  }, [theme, resolvedTheme, applyTheme, isClient])

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
  if (!isClient) {
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
