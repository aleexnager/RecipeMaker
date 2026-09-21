import type { NutritionFacts } from '../../types'

/** Campos nutricionales en orden de visualización, compartidos entre la ficha y el editor. */
export const NUTRITION_FIELDS: Array<{ key: keyof NutritionFacts; labelKey: string; unit: string; indent?: boolean }> = [
  { key: 'calories', labelKey: 'nutrition.calories', unit: 'kcal' },
  { key: 'protein', labelKey: 'nutrition.protein', unit: 'g' },
  { key: 'fat', labelKey: 'nutrition.fat', unit: 'g' },
  { key: 'saturatedFat', labelKey: 'nutrition.saturatedFat', unit: 'g', indent: true },
  { key: 'carbs', labelKey: 'nutrition.carbs', unit: 'g' },
  { key: 'sugars', labelKey: 'nutrition.sugars', unit: 'g', indent: true },
  { key: 'fiber', labelKey: 'nutrition.fiber', unit: 'g' },
  { key: 'salt', labelKey: 'nutrition.salt', unit: 'g' },
]
