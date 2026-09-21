import type { NutritionFacts } from '../types'
import { NUTRITION_FIELDS } from '../lib/i18n/nutritionFields'
import { useI18n } from '../lib/i18n/context'

interface NutritionFieldsEditorProps {
  value: NutritionFacts
  onChange: (value: NutritionFacts) => void
}

export function NutritionFieldsEditor({ value, onChange }: NutritionFieldsEditorProps) {
  const { t } = useI18n()

  return (
    <div>
      <p className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t('nutrition.per100g')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {NUTRITION_FIELDS.map(({ key, labelKey, unit }) => (
          <label key={key} className="text-sm">
            <span className="mb-1.5 block px-1 text-zinc-600 dark:text-zinc-300">
              {t(labelKey)} <span className="text-zinc-400 dark:text-zinc-500">({unit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={Number.isFinite(value[key]) ? value[key] : 0}
              onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) || 0 })}
              className="w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] shadow-sm shadow-black/[0.03] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
