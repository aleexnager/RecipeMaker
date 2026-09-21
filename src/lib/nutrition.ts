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
 * Calcula el aporte nutricional total de una receta sumando cada ingrediente
 * (según la cantidad usada) y también el valor por ración.
 */
export function calculateRecipeNutrition(
  recipe: Pick<Recipe, 'ingredients' | 'servings'>,
  ingredientsById: Map<string, Ingredient>,
): { total: NutritionFacts; perServing: NutritionFacts; missingIngredientIds: string[] } {
  let total = EMPTY_NUTRITION
  const missingIngredientIds: string[] = []

  for (const recipeIngredient of recipe.ingredients) {
    const ingredient = ingredientsById.get(recipeIngredient.ingredientId)
    if (!ingredient) {
      missingIngredientIds.push(recipeIngredient.ingredientId)
      continue
    }
    const factor = portionFactor(recipeIngredient.quantity, recipeIngredient.unit)
    total = addNutrition(total, scaleNutrition(ingredient.nutritionPer100g, factor))
  }

  const servings = recipe.servings > 0 ? recipe.servings : 1
  const perServing = scaleNutrition(total, 1 / servings)

  return {
    total: roundNutrition(total),
    perServing: roundNutrition(perServing),
    missingIngredientIds,
  }
}
