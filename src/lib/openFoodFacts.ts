import { EMPTY_NUTRITION, type IngredientCategory, type NutritionFacts } from '../types'

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
  brands?: string
  categories_tags?: string[]
  image_url?: string
  nutriments?: Record<string, number>
}

interface OffResponse {
  status: number
  product?: OffProduct
}

/** Mapea las categorías de Open Food Facts (en inglés, jerárquicas) a nuestras categorías simplificadas. */
const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: IngredientCategory }> = [
  { keywords: ['vegetable', 'legume-vegetable', 'potatoes'], category: 'Verduras y hortalizas' },
  { keywords: ['fruit', 'fruits'], category: 'Frutas' },
  { keywords: ['meat', 'poultry', 'sausage', 'charcuterie'], category: 'Carnes' },
  { keywords: ['fish', 'seafood', 'shellfish'], category: 'Pescados y mariscos' },
  { keywords: ['egg'], category: 'Huevos' },
  { keywords: ['dairy', 'milk', 'cheese', 'yogurt', 'yoghurt', 'cream'], category: 'Lácteos y derivados' },
  { keywords: ['pasta', 'rice', 'cereal', 'flour', 'breakfast-cereal'], category: 'Cereales, pasta y arroz' },
  { keywords: ['legume', 'beans', 'lentil', 'chickpea'], category: 'Legumbres' },
  { keywords: ['bread', 'bakery', 'pastr', 'viennoiserie'], category: 'Pan y bollería' },
  { keywords: ['spice', 'condiment', 'herb', 'seasoning'], category: 'Especias y condimentos' },
  { keywords: ['sauce', 'oil', 'vinegar', 'mayonnaise', 'ketchup'], category: 'Salsas y aceites' },
  { keywords: ['nut', 'seed', 'dried-fruit'], category: 'Frutos secos y semillas' },
  { keywords: ['beverage', 'juice', 'soda', 'water', 'coffee', 'tea', 'drink'], category: 'Bebidas' },
  { keywords: ['snack', 'chip', 'chocolate', 'candy', 'biscuit', 'cookie', 'sweet', 'dessert'], category: 'Snacks y dulces' },
  { keywords: ['frozen'], category: 'Congelados' },
  { keywords: ['canned', 'conserve', 'preserved'], category: 'Conservas' },
]

function mapCategory(categoriesTags: string[] | undefined): IngredientCategory {
  if (!categoriesTags?.length) return 'Otros'
  const haystack = categoriesTags.join(' ').toLowerCase()
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.category
    }
  }
  return 'Otros'
}

function readNutrient(nutriments: Record<string, number> | undefined, key: string): number {
  const value = nutriments?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Busca un producto por su código de barras en la base de datos abierta Open Food Facts. */
export async function lookupBarcode(barcode: string): Promise<OffLookupResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_es,brands,categories_tags,image_url,nutriments`

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    return { found: false, category: 'Otros', nutritionPer100g: EMPTY_NUTRITION }
  }

  const data = (await response.json()) as OffResponse
  if (data.status !== 1 || !data.product) {
    return { found: false, category: 'Otros', nutritionPer100g: EMPTY_NUTRITION }
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

  return {
    found: true,
    name: product.product_name_es || product.product_name || undefined,
    brand: product.brands?.split(',')[0]?.trim(),
    category: mapCategory(product.categories_tags),
    nutritionPer100g,
    imageUrl: product.image_url,
  }
}
