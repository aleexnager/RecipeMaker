import { db } from './database'
import { isGenericIngredient, suggestGenericIngredient } from '../lib/ingredientLinks'
import type { IngredientCategory, KitchenTool, RecipeCategoryTag, ToolCategory } from '../types'

const OLD_INGREDIENT_CATEGORY_MAP: Record<string, IngredientCategory> = {
  'Verduras y hortalizas': 'vegetables',
  Frutas: 'fruits',
  Carnes: 'meat',
  'Pescados y mariscos': 'fish_seafood',
  Huevos: 'eggs',
  'Lácteos y derivados': 'dairy',
  'Cereales, pasta y arroz': 'grains_pasta_rice',
  Legumbres: 'legumes',
  'Pan y bollería': 'bakery',
  'Especias y condimentos': 'spices_condiments',
  'Salsas y aceites': 'sauces_oils',
  'Frutos secos y semillas': 'nuts_seeds',
  Bebidas: 'beverages',
  'Snacks y dulces': 'snacks_sweets',
  Congelados: 'frozen',
  Conservas: 'canned',
  Otros: 'other',
}

const OLD_TOOL_CATEGORY_MAP: Record<string, ToolCategory> = {
  'Cocción en fuego': 'stovetop',
  'Horno y calor seco': 'oven_dry_heat',
  Electrodomésticos: 'appliances',
  'Pequeño electro / procesado': 'small_appliances',
  'Otros utensilios': 'other_tools',
}

const OLD_RECIPE_CATEGORY_MAP: Record<string, RecipeCategoryTag> = {
  Desayuno: 'breakfast',
  Almuerzo: 'brunch',
  Comida: 'lunch',
  Cena: 'dinner',
  Aperitivo: 'appetizer',
  Postre: 'dessert',
  Snack: 'snack',
  Bebida: 'drink',
}

const OLD_TOOL_NAME_MAP: Record<string, string> = {
  Sartén: 'frying_pan',
  Olla: 'pot',
  Wok: 'wok',
  'Olla a presión / exprés': 'pressure_cooker',
  Plancha: 'griddle',
  'Cazuela de barro': 'clay_pot',
  Vaporera: 'steamer',
  Horno: 'oven',
  'Airfryer / freidora de aire': 'air_fryer',
  Microondas: 'microwave',
  Tostadora: 'toaster',
  'Barbacoa / parrilla': 'grill_bbq',
  'Grill / sandwichera': 'sandwich_press',
  'Thermomix / robot de cocina con cocción': 'cooking_food_processor',
  'Olla de cocción lenta (slow cooker)': 'slow_cooker',
  'Máquina de pan': 'bread_maker',
  'Freidora de aceite': 'deep_fryer',
  Arrocera: 'rice_cooker',
  'Batidora de vaso': 'blender',
  'Batidora de mano': 'hand_blender',
  'Robot picador / procesador de alimentos': 'food_processor',
  Licuadora: 'juicer',
  'Batidora de varillas / amasadora': 'stand_mixer',
  Exprimidor: 'citrus_squeezer',
  'Báscula de cocina': 'kitchen_scale',
  'Cuchillo de chef': 'chef_knife',
  'Tabla de cortar': 'cutting_board',
  Rallador: 'grater',
  Colador: 'strainer',
  'Molde de horno': 'baking_pan',
  'Termómetro de cocina': 'kitchen_thermometer',
}

const OLD_INGREDIENT_SEEDKEY_MAP: Record<string, string> = {
  Huevo: 'egg',
  'Arroz blanco': 'white_rice',
  'Pasta (macarrones)': 'pasta',
  Tomate: 'tomato',
  Cebolla: 'onion',
  Ajo: 'garlic',
  'Pechuga de pollo': 'chicken_breast',
  'Aceite de oliva virgen extra': 'olive_oil',
  Sal: 'salt',
  'Pimienta negra': 'black_pepper',
  'Queso parmesano': 'parmesan',
  'Leche entera': 'whole_milk',
}

const OLD_RECIPE_SEEDKEY_MAP: Record<string, string> = {
  'Tortilla francesa rápida': 'french_omelette',
  'Pasta con tomate y ajo': 'tomato_garlic_pasta',
  'Pollo al airfryer con arroz': 'airfryer_chicken_rice',
}

/**
 * Normaliza datos sembrados con versiones anteriores de la app (categorías y nombres de
 * utensilios en español, sin clave neutra para i18n) y fusiona utensilios duplicados que
 * pudieran haberse sembrado por una condición de carrera ya corregida en `ensureSeeded`.
 * Idempotente y guardada por una entrada en `meta`, igual que el sembrado inicial.
 */
export async function runMigrations(): Promise<void> {
  await migrateI18n()
  await linkProductsToGenerics()
}

async function migrateI18n(): Promise<void> {
  await db.transaction('rw', db.meta, db.tools, db.ingredients, db.recipes, async () => {
    const alreadyMigrated = await db.meta.get('migrated_i18n_v1')
    if (alreadyMigrated) return

    // 1. Normalizar categorías de ingredientes y añadir seedKey al catálogo de ejemplo.
    const ingredients = await db.ingredients.toArray()
    for (const ing of ingredients) {
      const patch: Partial<typeof ing> = {}
      const mappedCategory = OLD_INGREDIENT_CATEGORY_MAP[ing.category as unknown as string]
      if (mappedCategory) patch.category = mappedCategory
      if (!ing.seedKey && OLD_INGREDIENT_SEEDKEY_MAP[ing.name]) {
        patch.seedKey = OLD_INGREDIENT_SEEDKEY_MAP[ing.name]
      }
      if (Object.keys(patch).length > 0) await db.ingredients.update(ing.id, patch)
    }

    // 2. Normalizar categorías de recetas y añadir seedKey a las recetas de ejemplo.
    const recipes = await db.recipes.toArray()
    for (const recipe of recipes) {
      const patch: Partial<typeof recipe> = {}
      const mappedCategories = recipe.categories.map((c) => OLD_RECIPE_CATEGORY_MAP[c as unknown as string] ?? c)
      if (mappedCategories.some((c, i) => c !== recipe.categories[i])) patch.categories = mappedCategories
      if (!recipe.seedKey && OLD_RECIPE_SEEDKEY_MAP[recipe.name]) {
        patch.seedKey = OLD_RECIPE_SEEDKEY_MAP[recipe.name]
      }
      if (Object.keys(patch).length > 0) await db.recipes.update(recipe.id, patch)
    }

    // 3. Normalizar categoría y nombre (clave neutra) de utensilios predefinidos.
    let tools = await db.tools.toArray()
    for (const tool of tools) {
      const patch: Partial<KitchenTool> = {}
      const mappedCategory = OLD_TOOL_CATEGORY_MAP[tool.category as unknown as string]
      if (mappedCategory) patch.category = mappedCategory
      if (!tool.custom) {
        const mappedName = OLD_TOOL_NAME_MAP[tool.name]
        if (mappedName) patch.name = mappedName
      }
      if (Object.keys(patch).length > 0) await db.tools.update(tool.id, patch)
    }

    // 4. Fusionar utensilios duplicados (mismo nombre normalizado): conserva el primero,
    //    combina el estado "owned" y remapea las referencias en recipe.toolIds.
    tools = await db.tools.toArray()
    const byName = new Map<string, KitchenTool[]>()
    for (const tool of tools) {
      const key = `${tool.custom ? 'custom:' : 'predefined:'}${tool.name.trim().toLowerCase()}`
      const list = byName.get(key) ?? []
      list.push(tool)
      byName.set(key, list)
    }

    const idRemap = new Map<string, string>()
    const idsToDelete: string[] = []

    for (const group of byName.values()) {
      if (group.length <= 1) continue
      const [canonical, ...duplicates] = group
      const anyOwned = group.some((tool) => tool.owned)
      if (anyOwned !== canonical.owned) await db.tools.update(canonical.id, { owned: anyOwned })
      for (const duplicate of duplicates) {
        idRemap.set(duplicate.id, canonical.id)
        idsToDelete.push(duplicate.id)
      }
    }

    if (idsToDelete.length > 0) {
      await db.tools.bulkDelete(idsToDelete)
      const recipesWithTools = await db.recipes.toArray()
      for (const recipe of recipesWithTools) {
        if (!recipe.toolIds.some((toolId) => idRemap.has(toolId))) continue
        const remapped = Array.from(new Set(recipe.toolIds.map((toolId) => idRemap.get(toolId) ?? toolId)))
        await db.recipes.update(recipe.id, { toolIds: remapped })
      }
    }

    await db.meta.put({ key: 'migrated_i18n_v1', value: true })
  })
}

/**
 * Vincula los productos ya guardados (escaneados o con marca) a su ingrediente genérico, para que
 * cuenten en las recetas. Además repara un efecto del error original: al crear un producto nuevo la
 * cantidad se guardaba en la unidad por defecto "g", así que "12 huevos" quedaba como "12 g".
 * Para huevos, cantidades pequeñas en gramos se reinterpretan como unidades.
 */
async function linkProductsToGenerics(): Promise<void> {
  await db.transaction('rw', db.meta, db.ingredients, db.pantryItems, async () => {
    const alreadyMigrated = await db.meta.get('linked_generics_v1')
    if (alreadyMigrated) return

    const catalog = await db.ingredients.toArray()
    for (const ingredient of catalog) {
      if (ingredient.genericId || isGenericIngredient(ingredient)) continue
      const generic = suggestGenericIngredient(ingredient, catalog)
      if (!generic) continue

      const patch: { genericId: string; defaultUnit?: typeof ingredient.defaultUnit } = { genericId: generic.id }
      const countsInUnits = generic.defaultUnit === 'unit' && ingredient.category === 'eggs'
      if (countsInUnits && ingredient.defaultUnit !== 'unit') patch.defaultUnit = 'unit'
      await db.ingredients.update(ingredient.id, patch)

      if (countsInUnits) {
        const items = await db.pantryItems.where('ingredientId').equals(ingredient.id).toArray()
        for (const item of items) {
          if (item.unit === 'g' && item.quantity <= 36) await db.pantryItems.update(item.id, { unit: 'unit' })
        }
      }
    }

    await db.meta.put({ key: 'linked_generics_v1', value: true })
  })
}
