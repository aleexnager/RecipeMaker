import type { Ingredient, IngredientCategory, KitchenTool, Recipe, RecipeCategoryTag, RecipeStep, ToolCategory, Unit } from '../../types'
import type { TFunction } from './context'
import { seedIngredientTranslations, seedRecipeTranslations } from './seedContent'
import type { Language } from './types'

export function categoryLabel(category: IngredientCategory, t: TFunction): string {
  return t(`category.${category}`)
}

export function toolCategoryLabel(category: ToolCategory, t: TFunction): string {
  return t(`toolCategory.${category}`)
}

export function recipeCategoryLabel(category: RecipeCategoryTag, t: TFunction): string {
  return t(`recipeCategory.${category}`)
}

/** Utensilios predefinidos guardan una clave neutra en `name`; los añadidos a mano guardan texto literal. */
export function toolLabel(tool: Pick<KitchenTool, 'name' | 'custom'>, t: TFunction): string {
  return tool.custom ? tool.name : t(`tool.${tool.name}`)
}

export function unitLabel(unit: Unit, t: TFunction): string {
  return t(`unit.${unit}`)
}

function seedIngredientEntry(seedKey: string, language: Language) {
  return seedIngredientTranslations[language][seedKey] ?? seedIngredientTranslations.es[seedKey]
}

function seedRecipeEntry(seedKey: string, language: Language) {
  return seedRecipeTranslations[language][seedKey] ?? seedRecipeTranslations.es[seedKey]
}

/** Nombre a mostrar de un ingrediente: traducido si es del catálogo de ejemplo, literal si no. */
export function ingredientDisplayName(ingredient: Pick<Ingredient, 'name' | 'seedKey'>, language: Language): string {
  if (ingredient.seedKey) return seedIngredientEntry(ingredient.seedKey, language)?.name ?? ingredient.name
  return ingredient.name
}

/** Texto de búsqueda de un ingrediente: incluye el nombre literal y, si aplica, el traducido. */
export function ingredientSearchText(ingredient: Pick<Ingredient, 'name' | 'brand' | 'seedKey'>, language: Language): string {
  const parts = [ingredient.name, ingredientDisplayName(ingredient, language), ingredient.brand ?? '']
  return parts.join(' ').toLowerCase()
}

export function recipeDisplayName(recipe: Pick<Recipe, 'name' | 'seedKey'>, language: Language): string {
  if (recipe.seedKey) return seedRecipeEntry(recipe.seedKey, language)?.name ?? recipe.name
  return recipe.name
}

export function recipeDisplayDescription(recipe: Pick<Recipe, 'description' | 'seedKey'>, language: Language): string | undefined {
  if (recipe.seedKey) return seedRecipeEntry(recipe.seedKey, language)?.description ?? recipe.description
  return recipe.description
}

export function recipeDisplaySteps(recipe: Pick<Recipe, 'steps' | 'seedKey'>, language: Language): RecipeStep[] {
  if (recipe.seedKey) {
    const steps = seedRecipeEntry(recipe.seedKey, language)?.steps
    if (steps) return steps.map((text, index) => ({ order: index + 1, text }))
  }
  return recipe.steps
}
