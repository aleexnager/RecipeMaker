import { useI18n } from '../lib/i18n/context'

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n()
  const next = language === 'es' ? 'en' : 'es'
  const currentLabel = language === 'es' ? t('language.spanish') : t('language.english')

  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      title={`${currentLabel} · ${t('common.tapShort')}`}
      aria-label={`${currentLabel}. ${t('language.tapHint')}`}
      className="tap flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[13px] font-semibold text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
    >
      {t('language.current')}
    </button>
  )
}
