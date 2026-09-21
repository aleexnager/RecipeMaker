/** Unidad en la que se mide una cantidad de ingrediente. */
export type Unit = 'g' | 'ml' | 'unit'

/**
 * Categorías de ingredientes usadas para la categorización automática.
 * Claves neutras (independientes del idioma); su etiqueta visible se resuelve
 * vía i18n (ver src/lib/i18n). No renombrar sin migrar los datos ya guardados.
 */
export const INGREDIENT_CATEGORIES = [
  'vegetables',
  'fruits',
  'meat',
  'fish_seafood',
  'eggs',
  'dairy',
  'grains_pasta_rice',
  'legumes',
  'bakery',
  'spices_condiments',
  'sauces_oils',
  'nuts_seeds',
  'beverages',
  'snacks_sweets',
  'frozen',
  'canned',
  'other',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

/** Valores nutricionales referidos siempre a 100 g / 100 ml de producto. */
export interface NutritionFacts {
  calories: number // kcal
  protein: number // g
  fat: number // g
  saturatedFat: number // g
  carbs: number // g
  sugars: number // g
  fiber: number // g
  salt: number // g
}

export const EMPTY_NUTRITION: NutritionFacts = {
  calories: 0,
  protein: 0,
  fat: 0,
  saturatedFat: 0,
  carbs: 0,
  sugars: 0,
  fiber: 0,
  salt: 0,
}

/** Un ingrediente del catálogo: puede venir de un escaneo (Open Food Facts) o creado a mano. */
export interface Ingredient {
  id: string
  name: string
  brand?: string
  barcode?: string
  category: IngredientCategory
  nutritionPer100g: NutritionFacts
  defaultUnit: Unit
  imageUrl?: string
  source: 'manual' | 'openfoodfacts'
  createdAt: number
  /** Presente solo en el catálogo de ejemplo: clave para mostrar el nombre traducido (ver i18n). */
  seedKey?: string
}

/** Una unidad de ingrediente que el usuario tiene físicamente en su despensa. */
export interface PantryItem {
  id: string
  ingredientId: string
  quantity: number
  unit: Unit
  addedAt: number
}

/**
 * Categorías de utensilios de cocina, para agrupar el catálogo predefinido.
 * Claves neutras (independientes del idioma); ver INGREDIENT_CATEGORIES.
 */
export const TOOL_CATEGORIES = ['stovetop', 'oven_dry_heat', 'appliances', 'small_appliances', 'other_tools'] as const

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export interface KitchenTool {
  id: string
  /**
   * Para utensilios predefinidos (custom: false), clave neutra traducible (p.ej. "air_fryer").
   * Para utensilios añadidos a mano (custom: true), el texto literal escrito por el usuario.
   */
  name: string
  category: ToolCategory
  owned: boolean
  custom: boolean
}

/** Ingrediente dentro de una receta, con la cantidad necesaria. */
export interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unit: Unit
  optional: boolean
}

export interface RecipeStep {
  order: number
  text: string
}

/** Claves neutras (independientes del idioma); ver INGREDIENT_CATEGORIES. */
export const RECIPE_CATEGORIES = [
  'breakfast',
  'brunch',
  'lunch',
  'dinner',
  'appetizer',
  'dessert',
  'snack',
  'drink',
] as const

export type RecipeCategoryTag = (typeof RECIPE_CATEGORIES)[number]

export interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  toolIds: string[]
  categories: RecipeCategoryTag[]
  imageUrl?: string
  createdAt: number
  /** Presente solo en las recetas de ejemplo: clave para mostrar nombre/descripción/pasos traducidos. */
  seedKey?: string
}

export function totalTimeMinutes(recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes'>): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes
}
