import type { NutritionFacts } from '../types'

interface Field {
  key: keyof NutritionFacts
  label: string
  unit: string
}

const FIELDS: Field[] = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteínas', unit: 'g' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'saturatedFat', label: 'de las cuales saturadas', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'sugars', label: 'de los cuales azúcares', unit: 'g' },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
  { key: 'salt', label: 'Sal', unit: 'g' },
]

interface NutritionFieldsEditorProps {
  value: NutritionFacts
  onChange: (value: NutritionFacts) => void
}

export function NutritionFieldsEditor({ value, onChange }: NutritionFieldsEditorProps) {
  return (
    <div>
      <p className="mb-2 text-sm text-stone-500">Valores nutricionales por cada 100 g / 100 ml</p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, unit }) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-stone-600">
              {label} <span className="text-stone-400">({unit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={Number.isFinite(value[key]) ? value[key] : 0}
              onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
