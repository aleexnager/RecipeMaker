import { useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'recipemaker-theme'

export function getStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage no disponible (navegación privada, etc.): usamos la preferencia del sistema.
  }
  return 'system'
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (prefersDark() ? 'dark' : 'light') : preference
}

const THEME_COLOR = { light: '#16a34a', dark: '#0c0a09' } as const

export function applyTheme(preference: ThemePreference): void {
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
}

/** Gestiona la preferencia de tema (claro/oscuro/sistema), la persiste y la aplica al documento. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Nada que hacer si no se puede persistir; el tema seguirá aplicado en esta sesión.
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [theme])

  return { theme, setTheme, resolvedTheme: resolveTheme(theme) }
}
