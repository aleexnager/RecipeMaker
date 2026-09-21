import { useTheme, type ThemePreference } from '../lib/theme'
import { useI18n } from '../lib/i18n/context'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const LABEL_KEY: Record<ThemePreference, string> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const label = t(LABEL_KEY[theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      title={`${label} · ${t('common.tapShort')}`}
      aria-label={`${label}. ${t('theme.tapHint')}`}
      className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
    >
      {theme === 'light' && <SunIcon className="h-5 w-5" />}
      {theme === 'dark' && <MoonIcon className="h-5 w-5" />}
      {theme === 'system' && <MonitorIcon className="h-5 w-5" />}
    </button>
  )
}
