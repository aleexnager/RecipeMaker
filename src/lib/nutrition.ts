import { EMPTY_NUTRITION, type Ingredient, type NutritionFacts, type Recipe, type Unit } from '../types'

/**
 * Factor de conversión a "porciones de 100g/ml" para una cantidad+unidad dada.
 * Para unidad 'unit' (p.ej. "2 huevos"), se asume que nutritionPer100g del ingrediente
 * representa los valores por una unidad, ya que no hay forma genérica de convertir
 * unidades a gramos sin un peso medio declarado.
 */
function portionFactor(quantity: number, unit: Unit): number {
  if (unit === 'unit') return quantity
  return quantity / 100
}

function scaleNutrition(facts: NutritionFacts, factor: number): NutritionFacts {
  return {
    calories: facts.calories * factor,
    protein: facts.protein * factor,
    fat: facts.fat * factor,
    saturatedFat: facts.saturatedFat * factor,
    carbs: facts.carbs * factor,
    sugars: facts.sugars * factor,
    fiber: facts.fiber * factor,
    salt: facts.salt * factor,
  }
}

function addNutrition(a: NutritionFacts, b: NutritionFacts): NutritionFacts {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    saturatedFat: a.saturatedFat + b.saturatedFat,
    carbs: a.carbs + b.carbs,
    sugars: a.sugars + b.sugars,
    fiber: a.fiber + b.fiber,
    salt: a.salt + b.salt,
  }
}

export function roundNutrition(facts: NutritionFacts): NutritionFacts {
  return {
    calories: Math.round(facts.calories),
    protein: Math.round(facts.protein * 10) / 10,
    fat: Math.round(facts.fat * 10) / 10,
    saturatedFat: Math.round(facts.saturatedFat * 10) / 10,
    carbs: Math.round(facts.carbs * 10) / 10,
    sugars: Math.round(facts.sugars * 10) / 10,
    fiber: Math.round(facts.fiber * 10) / 10,
    salt: Math.round(facts.salt * 100) / 100,
  }
}

/**
 * Calcula el aporte nutricional de una receta a partir de sus ingredientes (cantidades tal
 * y como están escritas en la receta, que corresponden a `recipe.servings` raciones).
 *
 * `perServing` es siempre el valor intensivo (por 1 ración) y no depende de `targetServings`.
 * `total` es `perServing` escalado a `targetServings` (por defecto, las raciones originales
 * de la receta) — así, si el usuario pide más raciones en la vista de detalle, el total crece
 * proporcionalmente y el valor por ración se mantiene constante.
 */
export function calculateRecipeNutrition(
  recipe: Pick<Recipe, 'ingredients' | 'servings'>,
  ingredientsById: Map<string, Ingredient>,
  targetServings?: number,
): { total: NutritionFacts; perServing: NutritionFacts; missingIngredientIds: string[] } {
  let rawTotal = EMPTY_NUTRITION
  const missingIngredientIds: string[] = []

  for (const recipeIngredient of recipe.ingredients) {
    const ingredient = ingredientsById.get(recipeIngredient.ingredientId)
    if (!ingredient) {
      missingIngredientIds.push(recipeIngredient.ingredientId)
      continue
    }
    const factor = portionFactor(recipeIngredient.quantity, recipeIngredient.unit)
    rawTotal = addNutrition(rawTotal, scaleNutrition(ingredient.nutritionPer100g, factor))
  }

  const baseServings = recipe.servings > 0 ? recipe.servings : 1
  const perServing = scaleNutrition(rawTotal, 1 / baseServings)
  const effectiveServings = targetServings && targetServings > 0 ? targetServings : baseServings
  const total = scaleNutrition(perServing, effectiveServings)

  return {
    total: roundNutrition(total),
    perServing: roundNutrition(perServing),
    missingIngredientIds,
  }
}
