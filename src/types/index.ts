/** Unidad en la que se mide una cantidad de ingrediente. */
export type Unit = 'g' | 'ml' | 'unit'

/** Categorías de ingredientes usadas para la categorización automática. */
export const INGREDIENT_CATEGORIES = [
  'Verduras y hortalizas',
  'Frutas',
  'Carnes',
  'Pescados y mariscos',
  'Huevos',
  'Lácteos y derivados',
  'Cereales, pasta y arroz',
  'Legumbres',
  'Pan y bollería',
  'Especias y condimentos',
  'Salsas y aceites',
  'Frutos secos y semillas',
  'Bebidas',
  'Snacks y dulces',
  'Congelados',
  'Conservas',
  'Otros',
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
}

/** Una unidad de ingrediente que el usuario tiene físicamente en su despensa. */
export interface PantryItem {
  id: string
  ingredientId: string
  quantity: number
  unit: Unit
  addedAt: number
}

/** Categorías de utensilios de cocina, para agrupar el catálogo predefinido. */
export const TOOL_CATEGORIES = [
  'Cocción en fuego',
  'Horno y calor seco',
  'Electrodomésticos',
  'Pequeño electro / procesado',
  'Otros utensilios',
] as const

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export interface KitchenTool {
  id: string
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

export const RECIPE_CATEGORIES = [
  'Desayuno',
  'Almuerzo',
  'Comida',
  'Cena',
  'Aperitivo',
  'Postre',
  'Snack',
  'Bebida',
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
}

export function totalTimeMinutes(recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes'>): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes
}
