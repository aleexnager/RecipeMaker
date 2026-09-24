import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { formatQuantity } from '../../lib/units'
import { CartIcon, CheckIcon, CloseIcon, PlusIcon } from '../../components/icons'
import { useI18n } from '../../lib/i18n/context'
import { ingredientDisplayName } from '../../lib/i18n/labels'
import { setLocalUserName, useCurrentUser } from '../../lib/currentUser'
import { addToShoppingList } from '../../lib/shoppingList'
import type { ShoppingItem } from '../../types'

const fieldClass =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] shadow-sm shadow-black/[0.03] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]'

/** Paleta de colores para distinguir de un vistazo quién añadió cada cosa. */
const AUTHOR_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
]

function authorColor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length]
}

export function ShoppingListPage() {
  const { t, language } = useI18n()
  const currentUser = useCurrentUser()
  const items = useLiveQuery(() => db.shoppingItems.orderBy('addedAt').reverse().toArray(), [])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const ingredientsById = useMemo(() => new Map(ingredients?.map((i) => [i.id, i]) ?? []), [ingredients])

  const [quickAdd, setQuickAdd] = useState('')
  const [nameDraft, setNameDraft] = useState('')

  const pending = useMemo(() => items?.filter((item) => !item.checked) ?? [], [items])
  const bought = useMemo(() => items?.filter((item) => item.checked) ?? [], [items])

  function displayName(item: ShoppingItem): string {
    const ingredient = item.ingredientId ? ingredientsById.get(item.ingredientId) : undefined
    return ingredient ? ingredientDisplayName(ingredient, language) : item.name
  }

  async function handleQuickAdd(event: FormEvent) {
    event.preventDefault()
    const text = quickAdd.trim()
    if (!text || !currentUser.name) return
    // Si el texto coincide con un ingrediente del catálogo, se vincula para evitar duplicados.
    const needle = text.toLowerCase()
    const known = ingredients?.find(
      (i) => i.name.toLowerCase() === needle || ingredientDisplayName(i, language).toLowerCase() === needle,
    )
    await addToShoppingList({ ingredientId: known?.id, name: text, addedBy: currentUser.name, source: 'manual' })
    setQuickAdd('')
  }

  async function toggle(item: ShoppingItem) {
    await db.shoppingItems.update(item.id, { checked: !item.checked })
  }

  async function remove(item: ShoppingItem) {
    await db.shoppingItems.delete(item.id)
  }

  async function clearBought() {
    await db.shoppingItems.bulkDelete(bought.map((item) => item.id))
  }

  function handleSaveName(event: FormEvent) {
    event.preventDefault()
    setLocalUserName(nameDraft)
  }

  return (
    <div className="px-4 pt-2">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('shopping.title')}</h1>
        {currentUser.name && (
          <Link
            to="/shopping/add"
            aria-label={t('shopping.addAria')}
            className="tap flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
          >
            <PlusIcon className="h-5 w-5" strokeWidth={2} />
          </Link>
        )}
      </header>

      {!currentUser.name ? (
        <form onSubmit={handleSaveName} className="rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
          <p className="mb-1 font-semibold text-zinc-800 dark:text-zinc-100">{t('shopping.namePromptTitle')}</p>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{t('shopping.namePromptHint')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={t('shopping.namePlaceholder')}
              className={fieldClass}
            />
            <button
              type="submit"
              disabled={!nameDraft.trim()}
              className="tap shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t('shopping.nameSave')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleQuickAdd} className="mb-6 flex gap-2">
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            placeholder={t('shopping.quickAddPlaceholder')}
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={!quickAdd.trim()}
            aria-label={t('shopping.addAria')}
            className="tap flex w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-40"
          >
            <PlusIcon className="h-5 w-5" strokeWidth={2} />
          </button>
        </form>
      )}

      {currentUser.name && items?.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200/70 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <CartIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">{t('shopping.emptyTitle')}</p>
          <p className="max-w-[30ch] text-sm text-zinc-500 dark:text-zinc-400">{t('shopping.emptyHint')}</p>
        </div>
      )}

      <div className="space-y-6">
        {pending.length > 0 && (
          <ShoppingSection title={t('shopping.pending', { count: pending.length })}>
            {pending.map((item, index) => (
              <ShoppingRow key={item.id} item={item} index={index} name={displayName(item)} onToggle={toggle} onRemove={remove} />
            ))}
          </ShoppingSection>
        )}

        {bought.length > 0 && (
          <ShoppingSection
            title={t('shopping.bought')}
            action={
              <button onClick={clearBought} className="tap text-[13px] font-medium text-brand-600 dark:text-brand-400">
                {t('shopping.clearBought')}
              </button>
            }
          >
            {bought.map((item, index) => (
              <ShoppingRow key={item.id} item={item} index={index} name={displayName(item)} onToggle={toggle} onRemove={remove} />
            ))}
          </ShoppingSection>
        )}
      </div>
    </div>
  )
}

function ShoppingSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</h2>
        {action}
      </div>
      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">{children}</ul>
    </section>
  )
}

function ShoppingRow({
  item,
  index,
  name,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem
  index: number
  name: string
  onToggle: (item: ShoppingItem) => void
  onRemove: (item: ShoppingItem) => void
}) {
  const { t } = useI18n()
  return (
    <li
      className={`flex items-center gap-3 px-3.5 py-3 ${index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''}`}
    >
      <button
        onClick={() => onToggle(item)}
        aria-label={item.checked ? t('shopping.markPending') : t('shopping.markBought')}
        className={`tap flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          item.checked
            ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
            : 'border-zinc-300 dark:border-zinc-600'
        }`}
      >
        {item.checked && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium ${
            item.checked ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'
          }`}
        >
          {name}
          {item.quantity !== undefined && item.unit && (
            <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">{formatQuantity(item.quantity, item.unit, t)}</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${authorColor(item.addedBy)}`}
            title={t('shopping.addedBy', { name: item.addedBy })}
          >
            <span aria-hidden className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-current/15 text-[9px]">
              {item.addedBy.charAt(0).toUpperCase()}
            </span>
            {item.addedBy}
          </span>
          {item.source === 'auto' && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {t('shopping.autoBadge')}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onRemove(item)}
        aria-label={t('common.remove')}
        className="tap flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
      >
        <CloseIcon className="h-4 w-4" strokeWidth={2} />
      </button>
    </li>
  )
}
