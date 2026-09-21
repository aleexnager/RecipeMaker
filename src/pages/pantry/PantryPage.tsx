import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { formatQuantity } from '../../lib/units'
import type { Unit } from '../../types'

export function PantryPage() {
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), [])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])

  const ingredientsById = useMemo(() => new Map(ingredients?.map((i) => [i.id, i]) ?? []), [ingredients])

  const grouped = useMemo(() => {
    if (!pantryItems) return []
    const byCategory = new Map<string, typeof pantryItems>()
    for (const item of pantryItems) {
      const ingredient = ingredientsById.get(item.ingredientId)
      const category = ingredient?.category ?? 'Otros'
      const list = byCategory.get(category) ?? []
      list.push(item)
      byCategory.set(category, list)
    }
    return Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [pantryItems, ingredientsById])

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
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Mi despensa</h1>
        <Link
          to="/pantry/add"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white active:bg-brand-700"
        >
          + Añadir
        </Link>
      </header>

      {pantryItems?.length === 0 && (
        <div className="mt-10 text-center text-stone-500">
          <p className="mb-3">Tu despensa está vacía.</p>
          <Link to="/pantry/add" className="font-medium text-brand-600 underline">
            Añade tu primer ingrediente
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{category}</h2>
            <ul className="space-y-2">
              {items.map((item) => {
                const ingredient = ingredientsById.get(item.ingredientId)
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-stone-800">{ingredient?.name ?? 'Ingrediente eliminado'}</p>
                      {ingredient?.brand && <p className="text-xs text-stone-400">{ingredient.brand}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <QuantityStepper
                        quantity={item.quantity}
                        unit={item.unit}
                        onChange={(q) => updateQuantity(item.id, q)}
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Eliminar"
                        className="text-stone-300 hover:text-red-500"
                      >
                        ✕
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
  onChange,
}: {
  quantity: number
  unit: Unit
  onChange: (q: number) => void
}) {
  const step = unit === 'unit' ? 1 : 10
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-1.5 py-1">
      <button
        onClick={() => onChange(Math.max(0, quantity - step))}
        className="h-6 w-6 rounded-full bg-white text-stone-600 shadow-sm"
      >
        −
      </button>
      <span className="min-w-14 text-center text-sm text-stone-700">{formatQuantity(quantity, unit)}</span>
      <button
        onClick={() => onChange(quantity + step)}
        className="h-6 w-6 rounded-full bg-white text-stone-600 shadow-sm"
      >
        +
      </button>
    </div>
  )
}
