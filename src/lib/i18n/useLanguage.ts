import { useEffect, useState } from 'react'
import type { Language } from './types'

const STORAGE_KEY = 'recipemaker-language'

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    // localStorage no disponible: seguimos con la detección por navegador.
  }
  try {
    if (navigator.language?.toLowerCase().startsWith('en')) return 'en'
  } catch {
    // navigator no disponible (SSR, tests, etc.).
  }
  return 'es'
}

/** Gestiona la preferencia de idioma (es/en), la persiste y sincroniza `<html lang>`. */
export function useLanguage() {
  const [language, setLanguage] = useState<Language>(getStoredLanguage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Nada que hacer si no se puede persistir; el idioma seguirá aplicado en esta sesión.
    }
    document.documentElement.lang = language
  }, [language])

  return { language, setLanguage }
}
