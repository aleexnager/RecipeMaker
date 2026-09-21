import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { formatQuantity } from '../../lib/units'
import { BasketIcon, CloseIcon, MinusIcon, PlusIcon } from '../../components/icons'
import { useI18n } from '../../lib/i18n/context'
import { categoryLabel, ingredientDisplayName } from '../../lib/i18n/labels'
import type { TFunction } from '../../lib/i18n/context'
import type { IngredientCategory, Unit } from '../../types'

export function PantryPage() {
  const { t, language } = useI18n()
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), [])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])

  const ingredientsById = useMemo(() => new Map(ingredients?.map((i) => [i.id, i]) ?? []), [ingredients])

  const grouped = useMemo(() => {
    if (!pantryItems) return []
    const byCategory = new Map<IngredientCategory, typeof pantryItems>()
    for (const item of pantryItems) {
      const ingredient = ingredientsById.get(item.ingredientId)
      const category = ingredient?.category ?? 'other'
      const list = byCategory.get(category) ?? []
      list.push(item)
      byCategory.set(category, list)
    }
    return Array.from(byCategory.entries()).sort((a, b) => categoryLabel(a[0], t).localeCompare(categoryLabel(b[0], t)))
  }, [pantryItems, ingredientsById, t])

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await db.pantryItems.delete(itemId)
    } else {
      await db.pantryItems.update(itemId, { quantity })
    }
  }

  async function removeItem(itemId: string) {
    await db.pantryItems.delete(itemId)
  }

  return (
    <div className="px-4 pt-2">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('nav.pantry')}</h1>
        <Link
          to="/pantry/add"
          aria-label={t('pantry.addAria')}
          className="tap flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
        >
          <PlusIcon className="h-5 w-5" strokeWidth={2} />
        </Link>
      </header>

      {pantryItems?.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200/70 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <BasketIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">{t('pantry.emptyTitle')}</p>
          <p className="mb-4 max-w-[24ch] text-sm text-zinc-500 dark:text-zinc-400">{t('pantry.emptyHint')}</p>
          <Link
            to="/pantry/add"
            className="tap rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t('pantry.emptyCta')}
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {categoryLabel(category, t)}
            </h2>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
              {items.map((item, index) => {
                const ingredient = ingredientsById.get(item.ingredientId)
                return (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between px-3.5 py-3 ${
                      index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                        {ingredient ? ingredientDisplayName(ingredient, language) : t('pantry.deletedIngredient')}
                      </p>
                      {ingredient?.brand && <p className="text-xs text-zinc-400 dark:text-zinc-500">{ingredient.brand}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <QuantityStepper
                        quantity={item.quantity}
                        unit={item.unit}
                        t={t}
                        onChange={(q) => updateQuantity(item.id, q)}
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={t('common.remove')}
                        className="tap flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                      >
                        <CloseIcon className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function QuantityStepper({
  quantity,
  unit,
  t,
  onChange,
}: {
  quantity: number
  unit: Unit
  t: TFunction
  onChange: (q: number) => void
}) {
  const step = unit === 'unit' ? 1 : 10
  return (
    <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
      <button
        onClick={() => onChange(Math.max(0, quantity - step))}
        aria-label={t('common.subtract')}
        className="tap flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm dark:bg-zinc-700 dark:text-zinc-200"
      >
        <MinusIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span className="min-w-14 text-center text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
        {formatQuantity(quantity, unit, t)}
      </span>
      <button
        onClick={() => onChange(quantity + step)}
        aria-label={t('common.add')}
        className="tap flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm dark:bg-zinc-700 dark:text-zinc-200"
      >
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  )
}
