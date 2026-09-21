import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { BasketIcon, BookIcon, ToolIcon } from './icons'
import { useI18n } from '../lib/i18n/context'

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n()

  const tabs = [
    { to: '/recipes', label: t('nav.recipes'), icon: BookIcon },
    { to: '/pantry', label: t('nav.pantry'), icon: BasketIcon },
    { to: '/tools', label: t('nav.tools'), icon: ToolIcon },
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-zinc-100 dark:bg-black">
      <header className="safe-top flex items-center justify-between bg-zinc-100/80 px-4 py-2.5 backdrop-blur-xl dark:bg-black/70">
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          RecipeMaker
        </span>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 mx-auto flex max-w-2xl border-t border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/75">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `tap flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400 dark:text-zinc-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
