import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark'

interface ThemeCtx {
  mode: ThemeMode
  toggle: () => void
  setMode: (m: ThemeMode) => void
}

const STORAGE_KEY = 'tfc-theme'

const ThemeContext = createContext<ThemeCtx | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem(STORAGE_KEY, mode) } catch {}
  }, [mode])

  const setMode = useCallback((m: ThemeMode) => setModeState(m), [])
  const toggle = useCallback(() => setModeState(m => m === 'dark' ? 'light' : 'dark'), [])

  return (
    <ThemeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
