import Dexie, { type EntityTable } from 'dexie'
import type { Ingredient, KitchenTool, PantryItem, Recipe, ShoppingItem } from '../types'

export interface MetaEntry {
  key: string
  value: unknown
}

class RecipeMakerDB extends Dexie {
  ingredients!: EntityTable<Ingredient, 'id'>
  pantryItems!: EntityTable<PantryItem, 'id'>
  tools!: EntityTable<KitchenTool, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  shoppingItems!: EntityTable<ShoppingItem, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor() {
    super('recipemaker')

    this.version(1).stores({
      ingredients: 'id, name, barcode, category, source',
      pantryItems: 'id, ingredientId',
      tools: 'id, name, category, owned',
      recipes: 'id, name, *categories, *toolIds',
      meta: 'key',
    })

    this.version(2).stores({
      ingredients: 'id, name, barcode, category, source, genericId',
      shoppingItems: 'id, ingredientId, checked, addedAt',
    })
  }
}

export const db = new RecipeMakerDB()
