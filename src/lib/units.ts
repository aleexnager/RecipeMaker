import type { Unit } from '../types'

export const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  ml: 'ml',
  unit: 'ud.',
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const rounded = Math.round(quantity * 100) / 100
  return `${rounded} ${UNIT_LABELS[unit]}`
}
