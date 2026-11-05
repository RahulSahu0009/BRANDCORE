/**
 * BRANDCORE — Theme Provider
 * Manages light/dark theme with localStorage persistence and system preference respect.
 *
 * Strategy:
 * - class-based dark mode (tailwind darkMode: 'class')
 * - 'dark' class applied to document.documentElement
 * - Preference persisted in localStorage under 'brandcore-theme'
 * - Falls back to prefers-color-scheme when no manual preference
 * - Theme applied before UI renders to avoid flash
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'brandcore-theme'
const DARK_CLASS = 'dark'

function getInitialTheme() {
  // Check for SSR-safe localStorage access
  if (typeof window === 'undefined') {
    return 'light'
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  // No manual preference — respect system
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add(DARK_CLASS)
  } else {
    root.classList.remove(DARK_CLASS)
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [mounted, setMounted] = useState(false)

  // Apply theme to DOM on mount and whenever theme changes
  useEffect(() => {
    setMounted(true)
    applyTheme(theme)
  }, [theme])

  // Listen for system preference changes when no manual preference is set
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    localStorage.setItem(STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
  }, [])

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    mounted,
  }

  return (
    <ThemeContext.Provider value={value}>
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
