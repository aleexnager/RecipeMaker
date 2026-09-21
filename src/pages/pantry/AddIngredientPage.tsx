import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { NutritionFieldsEditor } from '../../components/NutritionFieldsEditor'
import { CameraIcon, ChevronLeftIcon } from '../../components/icons'

const BarcodeScanner = lazy(() =>
  import('../../components/BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })),
)
import { lookupBarcode } from '../../lib/openFoodFacts'
import { newId } from '../../lib/id'
import { EMPTY_NUTRITION, INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory, type Unit } from '../../types'

const fieldClass =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] shadow-sm shadow-black/[0.03] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]'

const labelClass = 'mb-1.5 block px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

type Mode = 'existing' | 'new'

export function AddIngredientPage() {
  const navigate = useNavigate()
  const ingredients = useLiveQuery(() => db.ingredients.orderBy('name').toArray(), [])
  const [mode, setMode] = useState<Mode>('existing')
  const [search, setSearch] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)

  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [quantityUnit, setQuantityUnit] = useState<Unit>('g')

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState<IngredientCategory>('Otros')
  const [defaultUnit, setDefaultUnit] = useState<Unit>('g')
  const [nutrition, setNutrition] = useState(EMPTY_NUTRITION)

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return []
    const needle = search.trim().toLowerCase()
    if (!needle) return ingredients
    return ingredients.filter(
      (i) => i.name.toLowerCase().includes(needle) || i.brand?.toLowerCase().includes(needle),
    )
  }, [ingredients, search])

  const selectedIngredient = ingredients?.find((i) => i.id === selectedIngredientId)

  async function handleBarcodeDetected(code: string) {
    setScannerOpen(false)
    setScanStatus('Buscando producto…')

    const existing = await db.ingredients.where('barcode').equals(code).first()
    if (existing) {
      setMode('existing')
      setSelectedIngredientId(existing.id)
      setQuantityUnit(existing.defaultUnit)
      setScanStatus(`Ya tienes "${existing.name}" en tu catálogo.`)
      return
    }

    try {
      const result = await lookupBarcode(code)
      setMode('new')
      setBarcode(code)
      if (result.found) {
        setName(result.name ?? '')
        setBrand(result.brand ?? '')
        setCategory(result.category)
        setNutrition(result.nutritionPer100g)
        setScanStatus('Producto encontrado en Open Food Facts. Revisa y completa los datos.')
      } else {
        setScanStatus('No se encontró el producto. Completa los datos manualmente.')
      }
    } catch {
      setMode('new')
      setBarcode(code)
      setScanStatus('No se pudo consultar Open Food Facts. Completa los datos manualmente.')
    }
  }

  async function handleAddExisting() {
    if (!selectedIngredient) return
    const qty = Number(quantity)
    if (!qty || qty <= 0) return

    await db.pantryItems.add({
      id: newId(),
      ingredientId: selectedIngredient.id,
      quantity: qty,
      unit: quantityUnit,
      addedAt: Date.now(),
    })
    navigate('/pantry')
  }

  async function handleCreateNew() {
    if (!name.trim()) return
    const qty = Number(quantity)

    const ingredient: Ingredient = {
      id: newId(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode || undefined,
      category,
      nutritionPer100g: nutrition,
      defaultUnit,
      source: barcode ? 'openfoodfacts' : 'manual',
      createdAt: Date.now(),
    }
    await db.ingredients.add(ingredient)

    if (qty > 0) {
      await db.pantryItems.add({
        id: newId(),
        ingredientId: ingredient.id,
        quantity: qty,
        unit: defaultUnit,
        addedAt: Date.now(),
      })
    }
    navigate('/pantry')
  }

  return (
    <div className="px-4 pt-2 pb-4">
      <header className="mb-4 flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="tap -ml-1.5 flex h-8 w-8 items-center justify-center rounded-full text-brand-600 dark:text-brand-400"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Añadir a la despensa</h1>
      </header>

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="tap mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-[16px] font-semibold text-white shadow-sm shadow-brand-600/20"
      >
        <CameraIcon className="h-5 w-5" strokeWidth={2} />
        Escanear código de barras
      </button>
      {scanStatus && <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{scanStatus}</p>}

      <div className="mb-5 flex rounded-xl bg-zinc-200/60 p-1 text-sm font-medium dark:bg-zinc-800/70">
        <button
          className={`tap flex-1 rounded-lg py-2 ${mode === 'existing' ? 'bg-white shadow-sm dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
          onClick={() => setMode('existing')}
        >
          Ingrediente existente
        </button>
        <button
          className={`tap flex-1 rounded-lg py-2 ${mode === 'new' ? 'bg-white shadow-sm dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
          onClick={() => setMode('new')}
        >
          Ingrediente nuevo
        </button>
      </div>

      {mode === 'existing' ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Buscar ingrediente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={fieldClass}
          />
          <div className="max-h-64 overflow-y-auto rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
            {filteredIngredients.length === 0 && (
              <p className="p-3.5 text-sm text-zinc-500 dark:text-zinc-400">No hay ingredientes que coincidan. Crea uno nuevo.</p>
            )}
            {filteredIngredients.map((ing, index) => (
              <button
                key={ing.id}
                onClick={() => {
                  setSelectedIngredientId(ing.id)
                  setQuantityUnit(ing.defaultUnit)
                }}
                className={`block w-full px-3.5 py-2.5 text-left ${index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''} ${
                  selectedIngredientId === ing.id ? 'bg-brand-50 dark:bg-brand-900/30' : ''
                }`}
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{ing.name}</span>
                {ing.brand && <span className="ml-1 text-zinc-400 dark:text-zinc-500">· {ing.brand}</span>}
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">{ing.category}</span>
              </button>
            ))}
          </div>

          {selectedIngredient && (
            <div className="flex items-end gap-2">
              <label className="flex-1 text-sm">
                <span className={labelClass}>Cantidad</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="text-sm">
                <span className={labelClass}>Unidad</span>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as Unit)}
                  className={fieldClass}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="unit">ud.</option>
                </select>
              </label>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedIngredient || !Number(quantity)}
            onClick={handleAddExisting}
            className="tap w-full rounded-2xl bg-brand-600 py-3.5 text-[16px] font-semibold text-white shadow-sm shadow-brand-600/20 disabled:opacity-40 dark:disabled:opacity-30"
          >
            Añadir a la despensa
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className={labelClass}>Nombre *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Marca</span>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={fieldClass} />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)} className={fieldClass}>
              {INGREDIENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Unidad habitual de medida</span>
            <select value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as Unit)} className={fieldClass}>
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unit">Unidades (p.ej. huevos)</option>
            </select>
          </label>

          <NutritionFieldsEditor value={nutrition} onChange={setNutrition} />

          <label className="block text-sm">
            <span className={labelClass}>Cantidad que tienes ahora (opcional)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={fieldClass}
            />
          </label>

          <button
            type="button"
            disabled={!name.trim()}
            onClick={handleCreateNew}
            className="tap w-full rounded-2xl bg-brand-600 py-3.5 text-[16px] font-semibold text-white shadow-sm shadow-brand-600/20 disabled:opacity-40 dark:disabled:opacity-30"
          >
            Crear ingrediente
          </button>
        </div>
      )}

      {scannerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
              Cargando cámara…
            </div>
          }
        >
          <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
