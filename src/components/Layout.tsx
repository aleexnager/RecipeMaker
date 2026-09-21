import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/recipes', label: 'Recetas', icon: BookIcon },
  { to: '/pantry', label: 'Despensa', icon: BasketIcon },
  { to: '/tools', label: 'Utensilios', icon: ToolIcon },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-stone-100">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 mx-auto flex max-w-2xl border-t border-stone-200 bg-white/95 backdrop-blur">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-600' : 'text-stone-400'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 10h18l-1.6 9.1a2 2 0 0 1-2 1.65H6.6a2 2 0 0 1-2-1.65L3 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 10 9.5 4M16 10 14.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ToolIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2-2 2.1-2.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
