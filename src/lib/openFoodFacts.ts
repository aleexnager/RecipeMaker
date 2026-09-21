import { EMPTY_NUTRITION, type IngredientCategory, type NutritionFacts } from '../types'
import type { Language } from './i18n/types'

export interface OffLookupResult {
  found: boolean
  name?: string
  brand?: string
  category: IngredientCategory
  nutritionPer100g: NutritionFacts
  imageUrl?: string
}

interface OffProduct {
  product_name?: string
  product_name_es?: string
  product_name_en?: string
  brands?: string
  categories_tags?: string[]
  image_url?: string
  nutriments?: Record<string, number>
}

interface OffResponse {
  status: number
  product?: OffProduct
}

/** Mapea las categorías de Open Food Facts (en inglés, jerárquicas) a nuestras categorías neutras. */
const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: IngredientCategory }> = [
  { keywords: ['vegetable', 'legume-vegetable', 'potatoes'], category: 'vegetables' },
  { keywords: ['fruit', 'fruits'], category: 'fruits' },
  { keywords: ['meat', 'poultry', 'sausage', 'charcuterie'], category: 'meat' },
  { keywords: ['fish', 'seafood', 'shellfish'], category: 'fish_seafood' },
  { keywords: ['egg'], category: 'eggs' },
  { keywords: ['dairy', 'milk', 'cheese', 'yogurt', 'yoghurt', 'cream'], category: 'dairy' },
  { keywords: ['pasta', 'rice', 'cereal', 'flour', 'breakfast-cereal'], category: 'grains_pasta_rice' },
  { keywords: ['legume', 'beans', 'lentil', 'chickpea'], category: 'legumes' },
  { keywords: ['bread', 'bakery', 'pastr', 'viennoiserie'], category: 'bakery' },
  { keywords: ['spice', 'condiment', 'herb', 'seasoning'], category: 'spices_condiments' },
  { keywords: ['sauce', 'oil', 'vinegar', 'mayonnaise', 'ketchup'], category: 'sauces_oils' },
  { keywords: ['nut', 'seed', 'dried-fruit'], category: 'nuts_seeds' },
  { keywords: ['beverage', 'juice', 'soda', 'water', 'coffee', 'tea', 'drink'], category: 'beverages' },
  { keywords: ['snack', 'chip', 'chocolate', 'candy', 'biscuit', 'cookie', 'sweet', 'dessert'], category: 'snacks_sweets' },
  { keywords: ['frozen'], category: 'frozen' },
  { keywords: ['canned', 'conserve', 'preserved'], category: 'canned' },
]

function mapCategory(categoriesTags: string[] | undefined): IngredientCategory {
  if (!categoriesTags?.length) return 'other'
  const haystack = categoriesTags.join(' ').toLowerCase()
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.category
    }
  }
  return 'other'
}

function readNutrient(nutriments: Record<string, number> | undefined, key: string): number {
  const value = nutriments?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Busca un producto por su código de barras en la base de datos abierta Open Food Facts. */
export async function lookupBarcode(barcode: string, language: Language = 'es'): Promise<OffLookupResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_es,product_name_en,brands,categories_tags,image_url,nutriments`

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    return { found: false, category: 'other', nutritionPer100g: EMPTY_NUTRITION }
  }

  const data = (await response.json()) as OffResponse
  if (data.status !== 1 || !data.product) {
    return { found: false, category: 'other', nutritionPer100g: EMPTY_NUTRITION }
  }

  const product = data.product
  const nutriments = product.nutriments

  const nutritionPer100g: NutritionFacts = {
    calories: readNutrient(nutriments, 'energy-kcal_100g'),
    protein: readNutrient(nutriments, 'proteins_100g'),
    fat: readNutrient(nutriments, 'fat_100g'),
    saturatedFat: readNutrient(nutriments, 'saturated-fat_100g'),
    carbs: readNutrient(nutriments, 'carbohydrates_100g'),
    sugars: readNutrient(nutriments, 'sugars_100g'),
    fiber: readNutrient(nutriments, 'fiber_100g'),
    salt: readNutrient(nutriments, 'salt_100g'),
  }

  const localizedName = language === 'en' ? product.product_name_en : product.product_name_es

  return {
    found: true,
    name: localizedName || product.product_name || undefined,
    brand: product.brands?.split(',')[0]?.trim(),
    category: mapCategory(product.categories_tags),
    nutritionPer100g,
    imageUrl: product.image_url,
  }
}
