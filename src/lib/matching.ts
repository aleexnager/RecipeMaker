import type { Ingredient, PantryItem, Recipe, Unit } from '../types'
import { totalTimeMinutes } from '../types'
import { canonicalIngredientId, convertQuantity, gramsPerUnitOf } from './ingredientLinks'
import { recipeDisplayName } from './i18n/labels'
import type { Language } from './i18n/types'

export interface RecipeMatch {
  recipe: Recipe
  missingIngredientIds: string[]
  insufficientIngredientIds: string[]
  missingToolIds: string[]
  canMakeNow: boolean
  totalTimeMinutes: number
}

interface PantryStock {
  quantity: number
  unit: Unit
  gramsPerUnit?: number
}

/** Existencias de la despensa agrupadas por ingrediente canónico (un producto cuenta como su genérico). */
export type PantryTotals = Map<string, PantryStock[]>

export function buildPantryTotals(pantryItems: PantryItem[], ingredientsById: Map<string, Ingredient>): PantryTotals {
  const totals: PantryTotals = new Map()
  for (const item of pantryItems) {
    if (item.quantity <= 0) continue
    const key = canonicalIngredientId(item.ingredientId, ingredientsById)
    const list = totals.get(key) ?? []
    list.push({ quantity: item.quantity, unit: item.unit, gramsPerUnit: gramsPerUnitOf(item.ingredientId, ingredientsById) })
    totals.set(key, list)
  }
  return totals
}

export function matchRecipe(
  recipe: Recipe,
  pantryTotals: PantryTotals,
  ownedToolIds: Set<string>,
  ingredientsById: Map<string, Ingredient>,
): RecipeMatch {
  const missingIngredientIds: string[] = []
  const insufficientIngredientIds: string[] = []

  for (const recipeIngredient of recipe.ingredients) {
    if (recipeIngredient.optional) continue
    const stock = pantryTotals.get(canonicalIngredientId(recipeIngredient.ingredientId, ingredientsById))
    if (!stock?.length) {
      missingIngredientIds.push(recipeIngredient.ingredientId)
      continue
    }

    const recipeGramsPerUnit = gramsPerUnitOf(recipeIngredient.ingredientId, ingredientsById)
    let available = 0
    let comparable = false
    for (const entry of stock) {
      const converted = convertQuantity(entry.quantity, entry.unit, recipeIngredient.unit, entry.gramsPerUnit ?? recipeGramsPerUnit)
      if (converted === undefined) continue
      available += converted
      comparable = true
    }
    // Si hay existencias pero en una unidad no convertible (p.ej. "ud." sin peso medio), se da por
    // disponible: sabemos que lo tienes aunque no podamos comprobar si llega.
    if (comparable && available < recipeIngredient.quantity) {
      insufficientIngredientIds.push(recipeIngredient.ingredientId)
    }
  }

  const missingToolIds = recipe.toolIds.filter((toolId) => !ownedToolIds.has(toolId))

  return {
    recipe,
    missingIngredientIds,
    insufficientIngredientIds,
    missingToolIds,
    canMakeNow: missingIngredientIds.length === 0 && insufficientIngredientIds.length === 0 && missingToolIds.length === 0,
    totalTimeMinutes: totalTimeMinutes(recipe),
  }
}

export interface RecipeFilters {
  maxTotalTimeMinutes?: number
  onlyMakeableNow?: boolean
  requireOwnedTools?: boolean
  categories?: string[]
  searchText?: string
  /** Idioma activo: si se indica, la búsqueda también coincide con el nombre traducido de recetas de ejemplo. */
  language?: Language
}

export function matchAndFilterRecipes(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  ingredientsById: Map<string, Ingredient>,
  ownedToolIds: Set<string>,
  filters: RecipeFilters,
): RecipeMatch[] {
  const pantryTotals = buildPantryTotals(pantryItems, ingredientsById)
  let matches = recipes.map((recipe) => matchRecipe(recipe, pantryTotals, ownedToolIds, ingredientsById))

  if (filters.maxTotalTimeMinutes !== undefined) {
    matches = matches.filter((m) => m.totalTimeMinutes <= filters.maxTotalTimeMinutes!)
  }
  if (filters.onlyMakeableNow) {
    matches = matches.filter((m) => m.canMakeNow)
  }
  if (filters.requireOwnedTools) {
    matches = matches.filter((m) => m.missingToolIds.length === 0)
  }
  if (filters.categories?.length) {
    const wanted = new Set(filters.categories)
    matches = matches.filter((m) => m.recipe.categories.some((c) => wanted.has(c)))
  }
  if (filters.searchText?.trim()) {
    const needle = filters.searchText.trim().toLowerCase()
    matches = matches.filter((m) => {
      const literalName = m.recipe.name.toLowerCase()
      const displayName = filters.language ? recipeDisplayName(m.recipe, filters.language).toLowerCase() : literalName
      return literalName.includes(needle) || displayName.includes(needle)
    })
  }

  matches.sort((a, b) => {
    if (a.canMakeNow !== b.canMakeNow) return a.canMakeNow ? -1 : 1
    const missingDiff =
      a.missingIngredientIds.length + a.insufficientIngredientIds.length - (b.missingIngredientIds.length + b.insufficientIngredientIds.length)
    if (missingDiff !== 0) return missingDiff
    return a.totalTimeMinutes - b.totalTimeMinutes
  })

  return matches
}
