import type { KitchenTool } from '../types'
import { newId } from './id'

/**
 * Catálogo predefinido de utensilios de cocina habituales. El usuario marca cuáles tiene.
 * `name` es una clave neutra traducible (ver src/lib/i18n/dictionary.ts, prefijo "tool.").
 */
const PREDEFINED_TOOLS: Array<Pick<KitchenTool, 'name' | 'category'>> = [
  // Cocción en fuego
  { name: 'frying_pan', category: 'stovetop' },
  { name: 'pot', category: 'stovetop' },
  { name: 'wok', category: 'stovetop' },
  { name: 'pressure_cooker', category: 'stovetop' },
  { name: 'griddle', category: 'stovetop' },
  { name: 'clay_pot', category: 'stovetop' },
  { name: 'steamer', category: 'stovetop' },

  // Horno y calor seco
  { name: 'oven', category: 'oven_dry_heat' },
  { name: 'air_fryer', category: 'oven_dry_heat' },
  { name: 'microwave', category: 'oven_dry_heat' },
  { name: 'toaster', category: 'oven_dry_heat' },
  { name: 'grill_bbq', category: 'oven_dry_heat' },
  { name: 'sandwich_press', category: 'oven_dry_heat' },

  // Electrodomésticos grandes
  { name: 'cooking_food_processor', category: 'appliances' },
  { name: 'slow_cooker', category: 'appliances' },
  { name: 'bread_maker', category: 'appliances' },
  { name: 'deep_fryer', category: 'appliances' },
  { name: 'rice_cooker', category: 'appliances' },

  // Pequeño electro / procesado
  { name: 'blender', category: 'small_appliances' },
  { name: 'hand_blender', category: 'small_appliances' },
  { name: 'food_processor', category: 'small_appliances' },
  { name: 'juicer', category: 'small_appliances' },
  { name: 'stand_mixer', category: 'small_appliances' },
  { name: 'citrus_squeezer', category: 'small_appliances' },
  { name: 'kitchen_scale', category: 'small_appliances' },

  // Otros utensilios
  { name: 'chef_knife', category: 'other_tools' },
  { name: 'cutting_board', category: 'other_tools' },
  { name: 'grater', category: 'other_tools' },
  { name: 'strainer', category: 'other_tools' },
  { name: 'baking_pan', category: 'other_tools' },
  { name: 'kitchen_thermometer', category: 'other_tools' },
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
