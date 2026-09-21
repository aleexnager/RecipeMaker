import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { NutritionFieldsEditor } from '../../components/NutritionFieldsEditor'
import { CameraIcon, ChevronLeftIcon } from '../../components/icons'
import { useI18n } from '../../lib/i18n/context'
import { categoryLabel, ingredientDisplayName, ingredientSearchText, unitLabel } from '../../lib/i18n/labels'

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
  const { t, language } = useI18n()
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
  const [category, setCategory] = useState<IngredientCategory>('other')
  const [defaultUnit, setDefaultUnit] = useState<Unit>('g')
  const [nutrition, setNutrition] = useState(EMPTY_NUTRITION)

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return []
    const needle = search.trim().toLowerCase()
    if (!needle) return ingredients
    return ingredients.filter((i) => ingredientSearchText(i, language).includes(needle))
  }, [ingredients, search, language])

  const selectedIngredient = ingredients?.find((i) => i.id === selectedIngredientId)

  async function handleBarcodeDetected(code: string) {
    setScannerOpen(false)
    setScanStatus(t('addIngredient.scanStatusSearching'))

    const existing = await db.ingredients.where('barcode').equals(code).first()
    if (existing) {
      setMode('existing')
      setSelectedIngredientId(existing.id)
      setQuantityUnit(existing.defaultUnit)
      setScanStatus(t('addIngredient.scanStatusAlreadyHave', { name: ingredientDisplayName(existing, language) }))
      return
    }

    try {
      const result = await lookupBarcode(code, language)
      setMode('new')
      setBarcode(code)
      if (result.found) {
        setName(result.name ?? '')
        setBrand(result.brand ?? '')
        setCategory(result.category)
        setNutrition(result.nutritionPer100g)
        setScanStatus(t('addIngredient.scanStatusFound'))
      } else {
        setScanStatus(t('addIngredient.scanStatusNotFound'))
      }
    } catch {
      setMode('new')
      setBarcode(code)
      setScanStatus(t('addIngredient.scanStatusError'))
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
          aria-label={t('recipeDetail.backAria')}
          className="tap -ml-1.5 flex h-8 w-8 items-center justify-center rounded-full text-brand-600 dark:text-brand-400"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('addIngredient.title')}</h1>
      </header>

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="tap mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-[16px] font-semibold text-white shadow-sm shadow-brand-600/20"
      >
        <CameraIcon className="h-5 w-5" strokeWidth={2} />
        {t('addIngredient.scanButton')}
      </button>
      {scanStatus && <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{scanStatus}</p>}

      <div className="mb-5 flex rounded-xl bg-zinc-200/60 p-1 text-sm font-medium dark:bg-zinc-800/70">
        <button
          className={`tap flex-1 rounded-lg py-2 ${mode === 'existing' ? 'bg-white shadow-sm dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
          onClick={() => setMode('existing')}
        >
          {t('addIngredient.tabExisting')}
        </button>
        <button
          className={`tap flex-1 rounded-lg py-2 ${mode === 'new' ? 'bg-white shadow-sm dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
          onClick={() => setMode('new')}
        >
          {t('addIngredient.tabNew')}
        </button>
      </div>

      {mode === 'existing' ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('addIngredient.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={fieldClass}
          />
          <div className="max-h-64 overflow-y-auto rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
            {filteredIngredients.length === 0 && (
              <p className="p-3.5 text-sm text-zinc-500 dark:text-zinc-400">{t('addIngredient.noMatches')}</p>
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
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{ingredientDisplayName(ing, language)}</span>
                {ing.brand && <span className="ml-1 text-zinc-400 dark:text-zinc-500">· {ing.brand}</span>}
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">{categoryLabel(ing.category, t)}</span>
              </button>
            ))}
          </div>

          {selectedIngredient && (
            <div className="flex items-end gap-2">
              <label className="flex-1 text-sm">
                <span className={labelClass}>{t('field.quantity')}</span>
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
                <span className={labelClass}>{t('field.unit')}</span>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as Unit)}
                  className={fieldClass}
                >
                  <option value="g">{unitLabel('g', t)}</option>
                  <option value="ml">{unitLabel('ml', t)}</option>
                  <option value="unit">{unitLabel('unit', t)}</option>
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
            {t('addIngredient.addToPantry')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className={labelClass}>{t('field.name')}</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>{t('field.brand')}</span>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={fieldClass} />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>{t('field.category')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)} className={fieldClass}>
              {INGREDIENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c, t)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className={labelClass}>{t('addIngredient.defaultUnitLabel')}</span>
            <select value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as Unit)} className={fieldClass}>
              <option value="g">{t('unitOption.grams')}</option>
              <option value="ml">{t('unitOption.milliliters')}</option>
              <option value="unit">{t('unitOption.units')}</option>
            </select>
          </label>

          <NutritionFieldsEditor value={nutrition} onChange={setNutrition} />

          <label className="block text-sm">
            <span className={labelClass}>{t('addIngredient.quantityNowLabel')}</span>
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
            {t('addIngredient.createButton')}
          </button>
        </div>
      )}

      {scannerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
              {t('scanner.loadingCamera')}
            </div>
          }
        >
          <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
