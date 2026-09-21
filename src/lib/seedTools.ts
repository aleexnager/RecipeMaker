import type { KitchenTool } from '../types'
import { newId } from './id'

/** Catálogo predefinido de utensilios de cocina habituales. El usuario marca cuáles tiene. */
const PREDEFINED_TOOLS: Array<Pick<KitchenTool, 'name' | 'category'>> = [
  // Cocción en fuego
  { name: 'Sartén', category: 'Cocción en fuego' },
  { name: 'Olla', category: 'Cocción en fuego' },
  { name: 'Wok', category: 'Cocción en fuego' },
  { name: 'Olla a presión / exprés', category: 'Cocción en fuego' },
  { name: 'Plancha', category: 'Cocción en fuego' },
  { name: 'Cazuela de barro', category: 'Cocción en fuego' },
  { name: 'Vaporera', category: 'Cocción en fuego' },

  // Horno y calor seco
  { name: 'Horno', category: 'Horno y calor seco' },
  { name: 'Airfryer / freidora de aire', category: 'Horno y calor seco' },
  { name: 'Microondas', category: 'Horno y calor seco' },
  { name: 'Tostadora', category: 'Horno y calor seco' },
  { name: 'Barbacoa / parrilla', category: 'Horno y calor seco' },
  { name: 'Grill / sandwichera', category: 'Horno y calor seco' },

  // Electrodomésticos grandes
  { name: 'Thermomix / robot de cocina con cocción', category: 'Electrodomésticos' },
  { name: 'Olla de cocción lenta (slow cooker)', category: 'Electrodomésticos' },
  { name: 'Máquina de pan', category: 'Electrodomésticos' },
  { name: 'Freidora de aceite', category: 'Electrodomésticos' },
  { name: 'Arrocera', category: 'Electrodomésticos' },

  // Pequeño electro / procesado
  { name: 'Batidora de vaso', category: 'Pequeño electro / procesado' },
  { name: 'Batidora de mano', category: 'Pequeño electro / procesado' },
  { name: 'Robot picador / procesador de alimentos', category: 'Pequeño electro / procesado' },
  { name: 'Licuadora', category: 'Pequeño electro / procesado' },
  { name: 'Batidora de varillas / amasadora', category: 'Pequeño electro / procesado' },
  { name: 'Exprimidor', category: 'Pequeño electro / procesado' },
  { name: 'Báscula de cocina', category: 'Pequeño electro / procesado' },

  // Otros utensilios
  { name: 'Cuchillo de chef', category: 'Otros utensilios' },
  { name: 'Tabla de cortar', category: 'Otros utensilios' },
  { name: 'Rallador', category: 'Otros utensilios' },
  { name: 'Colador', category: 'Otros utensilios' },
  { name: 'Molde de horno', category: 'Otros utensilios' },
  { name: 'Termómetro de cocina', category: 'Otros utensilios' },
]

export function buildSeedTools(): KitchenTool[] {
  return PREDEFINED_TOOLS.map((tool) => ({
    id: newId(),
    name: tool.name,
    category: tool.category,
    owned: false,
    custom: false,
  }))
}
