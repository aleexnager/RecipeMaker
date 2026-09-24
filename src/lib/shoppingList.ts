import { db } from '../db/database'
import { newId } from './id'
import { canonicalIngredientId } from './ingredientLinks'
import type { ShoppingItem, Unit } from '../types'

interface NewShoppingItem {
  ingredientId?: string
  name: string
  quantity?: number
  unit?: Unit
  addedBy: string
  source: ShoppingItem['source']
}

/** Pendiente de comprar del mismo ingrediente (un producto y su genérico cuentan como el mismo). */
async function findPendingFor(ingredientId: string): Promise<ShoppingItem | undefined> {
  const [pending, ingredients] = await Promise.all([
    db.shoppingItems.filter((item) => !item.checked && Boolean(item.ingredientId)).toArray(),
    db.ingredients.toArray(),
  ])
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const target = canonicalIngredientId(ingredientId, byId)
  return pending.find((item) => canonicalIngredientId(item.ingredientId!, byId) === target)
}

/**
 * Añade un elemento a la lista. Si ya hay uno pendiente del mismo ingrediente, no duplica:
 * suma la cantidad cuando es compatible y, si no, deja el existente.
 */
export async function addToShoppingList(entry: NewShoppingItem): Promise<void> {
  if (entry.ingredientId) {
    const existing = await findPendingFor(entry.ingredientId)
    if (existing) {
      if (entry.quantity && entry.quantity > 0) {
        if (existing.quantity === undefined) {
          await db.shoppingItems.update(existing.id, { quantity: entry.quantity, unit: entry.unit })
        } else if (existing.unit === entry.unit) {
          await db.shoppingItems.update(existing.id, { quantity: existing.quantity + entry.quantity })
        }
      }
      return
    }
  }

  await db.shoppingItems.add({
    id: newId(),
    ingredientId: entry.ingredientId,
    name: entry.name,
    quantity: entry.quantity && entry.quantity > 0 ? entry.quantity : undefined,
    unit: entry.quantity && entry.quantity > 0 ? entry.unit : undefined,
    checked: false,
    addedBy: entry.addedBy,
    source: entry.source,
    addedAt: Date.now(),
  })
}

/**
 * Llamar cuando un elemento de la despensa se agota: si no queda nada más de ese ingrediente
 * (contando otros productos vinculados al mismo genérico), lo apunta en la lista de la compra.
 */
export async function addDepletedToShoppingList(ingredientId: string, name: string, addedBy: string): Promise<void> {
  const [pantryItems, ingredients] = await Promise.all([db.pantryItems.toArray(), db.ingredients.toArray()])
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const target = canonicalIngredientId(ingredientId, byId)
  const stillInStock = pantryItems.some(
    (item) => item.quantity > 0 && canonicalIngredientId(item.ingredientId, byId) === target,
  )
  if (stillInStock) return

  await addToShoppingList({ ingredientId, name, addedBy, source: 'auto' })
}
