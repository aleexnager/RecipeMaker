import type { PantryItem, Recipe } from '../types'
import { totalTimeMinutes } from '../types'
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

/** Suma, por ingrediente, la cantidad disponible en despensa agrupada por unidad. */
function buildPantryTotals(pantryItems: PantryItem[]): Map<string, Map<string, number>> {
  const totals = new Map<string, Map<string, number>>()
  for (const item of pantryItems) {
    const byUnit = totals.get(item.ingredientId) ?? new Map<string, number>()
    byUnit.set(item.unit, (byUnit.get(item.unit) ?? 0) + item.quantity)
    totals.set(item.ingredientId, byUnit)
  }
  return totals
}

export function matchRecipe(
  recipe: Recipe,
  pantryTotals: Map<string, Map<string, number>>,
  ownedToolIds: Set<string>,
): RecipeMatch {
  const missingIngredientIds: string[] = []
  const insufficientIngredientIds: string[] = []

  for (const recipeIngredient of recipe.ingredients) {
    if (recipeIngredient.optional) continue
    const byUnit = pantryTotals.get(recipeIngredient.ingredientId)
    const available = byUnit?.get(recipeIngredient.unit) ?? 0

    if (!byUnit || available <= 0) {
      missingIngredientIds.push(recipeIngredient.ingredientId)
    } else if (available < recipeIngredient.quantity) {
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
  ownedToolIds: Set<string>,
  filters: RecipeFilters,
): RecipeMatch[] {
  const pantryTotals = buildPantryTotals(pantryItems)
  let matches = recipes.map((recipe) => matchRecipe(recipe, pantryTotals, ownedToolIds))

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
