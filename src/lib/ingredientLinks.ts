import type { Ingredient, Unit } from '../types'
import { seedIngredientTranslations } from './i18n/seedContent'

/**
 * Vínculo producto → ingrediente genérico.
 *
 * Las recetas referencian ingredientes genéricos ("Huevo"), mientras que al escanear se crea un
 * producto concreto ("Huevos camperos L · Pazo") con su propio id. Sin este vínculo, el producto
 * escaneado nunca cuenta para las recetas. Aquí se resuelve el id canónico de cada ingrediente,
 * se sugiere automáticamente el genérico al que equivale un producto y se convierten cantidades
 * entre unidades para poder comparar despensa y receta.
 */

/** Unidad de un ingrediente cuando no se sabe su peso medio: se asume este (p.ej. huevo talla M/L). */
export const DEFAULT_GRAMS_PER_UNIT: Record<string, number> = {
  egg: 60,
}

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'en', 'al', 'of', 'the', 'and', 'with', 'a'])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Tokens significativos en singular aproximado ("huevos" → "huevo", "eggs" → "egg"). */
function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word))
}

/** Un ingrediente es "genérico" si no es un producto concreto (sin código de barras, marca ni vínculo). */
export function isGenericIngredient(ingredient: Ingredient): boolean {
  return !ingredient.barcode && !ingredient.brand && !ingredient.genericId
}

/** Todos los nombres con los que se conoce un ingrediente genérico (literal y traducciones). */
function knownNames(ingredient: Ingredient): string[] {
  const names = [ingredient.name]
  if (ingredient.seedKey) {
    for (const byKey of Object.values(seedIngredientTranslations)) {
      const translated = byKey[ingredient.seedKey]?.name
      if (translated) names.push(translated)
    }
  }
  return names
}

/**
 * Sugiere el ingrediente genérico al que equivale un producto, a partir de su nombre y categoría.
 * Conservador a propósito: exige que todas las palabras significativas del genérico aparezcan en
 * el nombre del producto (así "Aceite de girasol" no se confunde con "Aceite de oliva virgen extra")
 * y que la categoría coincida. Ante la duda no vincula: el usuario puede elegirlo a mano.
 * Como respaldo, si la categoría solo tiene un genérico y es de producto único (huevos), lo usa.
 */
export function suggestGenericIngredient(
  product: Pick<Ingredient, 'id' | 'name' | 'category'>,
  catalog: Ingredient[],
): Ingredient | undefined {
  const generics = catalog.filter((i) => i.id !== product.id && isGenericIngredient(i))
  const productTokens = new Set(tokens(product.name))

  let best: { ingredient: Ingredient; score: number } | undefined
  for (const generic of generics) {
    // La categoría también debe coincidir ("Tomate frito" es salsa, no tomate), salvo que el producto
    // venga sin categorizar, algo habitual en Open Food Facts.
    if (product.category !== 'other' && generic.category !== product.category) continue
    for (const name of knownNames(generic)) {
      const genericTokens = tokens(name)
      if (genericTokens.length === 0 || !genericTokens.every((token) => productTokens.has(token))) continue
      // Más palabras coincidentes = coincidencia más específica.
      const score = genericTokens.length
      if (!best || score > best.score) best = { ingredient: generic, score }
    }
  }
  if (best) return best.ingredient

  const SINGLE_PRODUCT_CATEGORIES = new Set(['eggs'])
  if (SINGLE_PRODUCT_CATEGORIES.has(product.category)) {
    const sameCategory = generics.filter((i) => i.category === product.category)
    if (sameCategory.length === 1) return sameCategory[0]
  }
  return undefined
}

/** Id con el que un ingrediente cuenta para las recetas: el de su genérico si está vinculado. */
export function canonicalIngredientId(ingredientId: string, ingredientsById: Map<string, Ingredient>): string {
  return ingredientsById.get(ingredientId)?.genericId ?? ingredientId
}

/** Peso medio por unidad de un ingrediente (o de su genérico), si se conoce. */
export function gramsPerUnitOf(ingredientId: string, ingredientsById: Map<string, Ingredient>): number | undefined {
  const ingredient = ingredientsById.get(ingredientId)
  if (!ingredient) return undefined
  if (ingredient.gramsPerUnit) return ingredient.gramsPerUnit
  const generic = ingredient.genericId ? ingredientsById.get(ingredient.genericId) : undefined
  if (generic?.gramsPerUnit) return generic.gramsPerUnit
  const seedKey = generic?.seedKey ?? ingredient.seedKey
  return seedKey ? DEFAULT_GRAMS_PER_UNIT[seedKey] : undefined
}

/**
 * Convierte una cantidad entre unidades. g ↔ ml se tratan como equivalentes (densidad ≈ 1, suficiente
 * para decidir si "hay bastante"); ud. ↔ g/ml requiere conocer el peso medio por unidad.
 * Devuelve undefined si la conversión no es posible.
 */
export function convertQuantity(quantity: number, from: Unit, to: Unit, gramsPerUnit?: number): number | undefined {
  if (from === to) return quantity
  const isMass = (unit: Unit) => unit === 'g' || unit === 'ml'
  if (isMass(from) && isMass(to)) return quantity
  if (!gramsPerUnit) return undefined
  if (from === 'unit') return quantity * gramsPerUnit
  return quantity / gramsPerUnit
}
