import type { NutritionFacts } from '../types'
import { NUTRITION_FIELDS } from '../lib/i18n/nutritionFields'
import { useI18n } from '../lib/i18n/context'

export function NutritionLabel({ facts, title }: { facts: NutritionFacts; title: string }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
      <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</h3>
      <dl className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
        {NUTRITION_FIELDS.map(({ key, labelKey, unit, indent }) => (
          <div key={key} className="flex justify-between py-1.5">
            <dt className={indent ? 'pl-3 text-zinc-500 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}>{t(labelKey)}</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-100">
              {facts[key]} {unit}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
