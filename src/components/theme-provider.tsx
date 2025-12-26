'use client'

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const defaultTheme = (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme) || 'light'
  const [theme, setTheme] = useState<Theme>(defaultTheme)
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

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    if (!isClient) return
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    localStorage.setItem('theme', theme)
  }, [theme, resolvedTheme, isClient])

  // Prevent flash of incorrect theme
  if (!isClient) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
