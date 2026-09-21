import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLanguage } from './useLanguage'
import { translations, type TranslateParams } from './dictionary'
import type { Language } from './types'

export type TFunction = (key: string, params?: TranslateParams) => string

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: TFunction
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useLanguage()

  const t = useMemo<TFunction>(() => {
    return (key, params = {}) => {
      const entry = translations[language][key] ?? translations.es[key]
      if (entry === undefined) return key
      return typeof entry === 'function' ? entry(params) : entry
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>.')
  return ctx
}
