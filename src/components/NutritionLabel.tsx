import type { NutritionFacts } from '../types'

const ROWS: Array<{ key: keyof NutritionFacts; label: string; unit: string; indent?: boolean }> = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteínas', unit: 'g' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'saturatedFat', label: 'de las cuales saturadas', unit: 'g', indent: true },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'sugars', label: 'de los cuales azúcares', unit: 'g', indent: true },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
  { key: 'salt', label: 'Sal', unit: 'g' },
]

export function NutritionLabel({ facts, title }: { facts: NutritionFacts; title: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="mb-2 font-semibold text-stone-900">{title}</h3>
      <dl className="divide-y divide-stone-100 text-sm">
        {ROWS.map(({ key, label, unit, indent }) => (
          <div key={key} className="flex justify-between py-1.5">
            <dt className={indent ? 'pl-3 text-stone-500' : 'text-stone-700'}>{label}</dt>
            <dd className="font-medium text-stone-800">
              {facts[key]} {unit}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
