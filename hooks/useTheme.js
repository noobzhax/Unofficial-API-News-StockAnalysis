import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sa-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState('dark')

  // Hydrate from localStorage after mount
  useEffect(() => {
    setTheme(getInitialTheme())
  }, [])

  useEffect(() => {
    document.body.className = `theme-${theme}`
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme, isDark: theme === 'dark' }
}
