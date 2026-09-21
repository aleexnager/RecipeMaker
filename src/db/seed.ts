import { db } from './database'
import { buildSeedTools } from '../lib/seedTools'
import { newId } from '../lib/id'
import type { Ingredient, KitchenTool, Recipe } from '../types'

function ingredient(
  name: string,
  category: Ingredient['category'],
  nutritionPer100g: Ingredient['nutritionPer100g'],
  defaultUnit: Ingredient['defaultUnit'] = 'g',
): Ingredient {
  return {
    id: newId(),
    name,
    category,
    nutritionPer100g,
    defaultUnit,
    source: 'manual',
    createdAt: Date.now(),
  }
}

function buildSeedRecipes(seedIngredients: Ingredient[], seedTools: KitchenTool[]): Recipe[] {
  const byName = new Map(seedIngredients.map((i) => [i.name, i]))
  const toolByName = new Map(seedTools.map((t) => [t.name, t]))
  const toolId = (name: string) => toolByName.get(name)?.id
  const need = (name: string) => byName.get(name)!.id
  const toolIds = (...names: string[]) => names.map(toolId).filter((x): x is string => Boolean(x))

  return [
    {
      id: newId(),
      name: 'Tortilla francesa rápida',
      description: 'Un clásico sencillo y rápido, ideal cuando el tiempo apremia.',
      servings: 1,
      prepTimeMinutes: 3,
      cookTimeMinutes: 4,
      ingredients: [
        { ingredientId: need('Huevo'), quantity: 2, unit: 'unit', optional: false },
        { ingredientId: need('Sal'), quantity: 1, unit: 'g', optional: false },
        { ingredientId: need('Aceite de oliva virgen extra'), quantity: 5, unit: 'ml', optional: false },
      ],
      steps: [
        { order: 1, text: 'Bate los huevos con una pizca de sal en un bol.' },
        { order: 2, text: 'Calienta el aceite en una sartén a fuego medio-alto.' },
        { order: 3, text: 'Vierte el huevo batido y cuaja 1-2 minutos por cada lado.' },
      ],
      toolIds: toolIds('Sartén'),
      categories: ['Almuerzo', 'Cena'],
      createdAt: Date.now(),
    },
    {
      id: newId(),
      name: 'Pasta con tomate y ajo',
      description: 'Pasta sencilla con un sofrito de tomate, cebolla y ajo.',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      ingredients: [
        { ingredientId: need('Pasta (macarrones)'), quantity: 200, unit: 'g', optional: false },
        { ingredientId: need('Tomate'), quantity: 300, unit: 'g', optional: false },
        { ingredientId: need('Cebolla'), quantity: 50, unit: 'g', optional: false },
        { ingredientId: need('Ajo'), quantity: 10, unit: 'g', optional: false },
        { ingredientId: need('Aceite de oliva virgen extra'), quantity: 15, unit: 'ml', optional: false },
        { ingredientId: need('Sal'), quantity: 3, unit: 'g', optional: false },
        { ingredientId: need('Queso parmesano'), quantity: 20, unit: 'g', optional: true },
      ],
      steps: [
        { order: 1, text: 'Pon a hervir agua con sal y cuece la pasta según el paquete.' },
        { order: 2, text: 'Sofríe la cebolla y el ajo picados en aceite hasta que estén dorados.' },
        { order: 3, text: 'Añade el tomate troceado y cocina 10-12 minutos a fuego medio.' },
        { order: 4, text: 'Escurre la pasta, mézclala con la salsa y sirve con queso al gusto.' },
      ],
      toolIds: toolIds('Olla', 'Sartén'),
      categories: ['Comida', 'Cena'],
      createdAt: Date.now(),
    },
    {
      id: newId(),
      name: 'Pollo al airfryer con arroz',
      description: 'Pechuga de pollo crujiente en freidora de aire acompañada de arroz blanco.',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      ingredients: [
        { ingredientId: need('Pechuga de pollo'), quantity: 300, unit: 'g', optional: false },
        { ingredientId: need('Arroz blanco'), quantity: 150, unit: 'g', optional: false },
        { ingredientId: need('Aceite de oliva virgen extra'), quantity: 10, unit: 'ml', optional: false },
        { ingredientId: need('Sal'), quantity: 3, unit: 'g', optional: false },
        { ingredientId: need('Pimienta negra'), quantity: 1, unit: 'g', optional: true },
      ],
      steps: [
        { order: 1, text: 'Salpimienta la pechuga y pincélala con aceite.' },
        { order: 2, text: 'Cocina en el airfryer a 190°C durante 15-18 minutos, dando la vuelta a mitad.' },
        { order: 3, text: 'Mientras, cuece el arroz en agua con sal según el paquete.' },
        { order: 4, text: 'Sirve el pollo troceado sobre el arroz.' },
      ],
      toolIds: toolIds('Airfryer / freidora de aire', 'Olla'),
      categories: ['Comida', 'Cena'],
      createdAt: Date.now(),
    },
  ]
}

/** Siembra utensilios, un pequeño catálogo de ingredientes básicos y un par de recetas de ejemplo
 * para que la app tenga contenido navegable desde el primer arranque.
 *
 * Todo ocurre dentro de una única transacción Dexie guardada por una entrada en `meta`: como las
 * transacciones de lectura-escritura de IndexedDB sobre las mismas tablas se serializan, esto evita
 * sembrar datos duplicados si el efecto de inicialización se invoca más de una vez (p.ej. React StrictMode). */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.meta, db.tools, db.ingredients, db.recipes, async () => {
    const alreadySeeded = await db.meta.get('seeded')
    if (alreadySeeded) return

    const seedTools = buildSeedTools()
    await db.tools.bulkAdd(seedTools)

    const seedIngredients: Ingredient[] = [
      ingredient('Huevo', 'Huevos', { calories: 155, protein: 13, fat: 11, saturatedFat: 3.3, carbs: 1.1, sugars: 1.1, fiber: 0, salt: 0.37 }, 'unit'),
      ingredient('Arroz blanco', 'Cereales, pasta y arroz', { calories: 130, protein: 2.7, fat: 0.3, saturatedFat: 0.1, carbs: 28, sugars: 0.1, fiber: 0.4, salt: 0 }),
      ingredient('Pasta (macarrones)', 'Cereales, pasta y arroz', { calories: 158, protein: 5.8, fat: 0.9, saturatedFat: 0.2, carbs: 31, sugars: 1.1, fiber: 1.8, salt: 0.01 }),
      ingredient('Tomate', 'Verduras y hortalizas', { calories: 18, protein: 0.9, fat: 0.2, saturatedFat: 0, carbs: 3.9, sugars: 2.6, fiber: 1.2, salt: 0.01 }),
      ingredient('Cebolla', 'Verduras y hortalizas', { calories: 40, protein: 1.1, fat: 0.1, saturatedFat: 0, carbs: 9.3, sugars: 4.2, fiber: 1.7, salt: 0 }),
      ingredient('Ajo', 'Verduras y hortalizas', { calories: 149, protein: 6.4, fat: 0.5, saturatedFat: 0.1, carbs: 33, sugars: 1, fiber: 2.1, salt: 0.02 }),
      ingredient('Pechuga de pollo', 'Carnes', { calories: 165, protein: 31, fat: 3.6, saturatedFat: 1, carbs: 0, sugars: 0, fiber: 0, salt: 0.09 }),
      ingredient('Aceite de oliva virgen extra', 'Salsas y aceites', { calories: 884, protein: 0, fat: 100, saturatedFat: 14, carbs: 0, sugars: 0, fiber: 0, salt: 0 }),
      ingredient('Sal', 'Especias y condimentos', { calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugars: 0, fiber: 0, salt: 100 }),
      ingredient('Pimienta negra', 'Especias y condimentos', { calories: 251, protein: 10.4, fat: 3.3, saturatedFat: 1.4, carbs: 64, sugars: 0.6, fiber: 25, salt: 0.02 }),
      ingredient('Queso parmesano', 'Lácteos y derivados', { calories: 392, protein: 35.8, fat: 25.8, saturatedFat: 16.4, carbs: 4.1, sugars: 0.9, fiber: 0, salt: 1.53 }),
      ingredient('Leche entera', 'Lácteos y derivados', { calories: 61, protein: 3.2, fat: 3.3, saturatedFat: 2, carbs: 4.8, sugars: 4.8, fiber: 0, salt: 0.1 }, 'ml'),
    ]
    await db.ingredients.bulkAdd(seedIngredients)

    const seedRecipes = buildSeedRecipes(seedIngredients, seedTools)
    await db.recipes.bulkAdd(seedRecipes)

    await db.meta.put({ key: 'seeded', value: true })
  })
}
