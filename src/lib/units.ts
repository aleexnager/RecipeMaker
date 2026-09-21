import type { Unit } from '../types'
import type { TFunction } from './i18n/context'
import { unitLabel } from './i18n/labels'

export function formatQuantity(quantity: number, unit: Unit, t: TFunction): string {
  const rounded = Math.round(quantity * 100) / 100
  return `${rounded} ${unitLabel(unit, t)}`
}
