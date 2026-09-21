import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { newId } from '../../lib/id'
import { NutritionFieldsEditor } from '../../components/NutritionFieldsEditor'
import { useI18n } from '../../lib/i18n/context'
import type { TFunction } from '../../lib/i18n/context'
import { categoryLabel, ingredientDisplayName, ingredientSearchText, recipeCategoryLabel, toolCategoryLabel, toolLabel } from '../../lib/i18n/labels'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  CloseIcon,
  PlusIcon,
} from '../../components/icons'
import {
  EMPTY_NUTRITION,
  INGREDIENT_CATEGORIES,
  RECIPE_CATEGORIES,
  TOOL_CATEGORIES,
  type Ingredient,
  type IngredientCategory,
  type Recipe,
  type RecipeCategoryTag,
  type RecipeIngredient,
  type Unit,
} from '../../types'

/** Estilo compartido para inputs/selects/textareas: tarjeta plana con anillo sutil, al estilo iOS. */
const fieldClass =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] shadow-sm shadow-black/[0.03] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]'

const chipClass = (active: boolean) =>
  `tap rounded-full px-3.5 py-1.5 text-sm font-medium ${
    active
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
      : 'bg-zinc-200/60 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300'
  }`

const sectionLabelClass = 'mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

interface DraftStep {
  key: string
  text: string
}

export function RecipeEditorPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const existingRecipe = useLiveQuery(() => (id ? db.recipes.get(id) : undefined), [id])
  const ingredients = useLiveQuery(() => db.ingredients.orderBy('name').toArray(), [])
  const tools = useLiveQuery(() => db.tools.toArray(), [])
  const ingredientsById = useMemo(() => new Map(ingredients?.map((i) => [i.id, i]) ?? []), [ingredients])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(2)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(10)
  const [cookTimeMinutes, setCookTimeMinutes] = useState(20)
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [steps, setSteps] = useState<DraftStep[]>([{ key: newId(), text: '' }])
  const [toolIds, setToolIds] = useState<string[]>([])
  const [categories, setCategories] = useState<RecipeCategoryTag[]>([])
  const [loadedFromExisting, setLoadedFromExisting] = useState(!isEditing)

  useEffect(() => {
    if (existingRecipe && !loadedFromExisting) {
      // Sincroniza el formulario, una única vez, con la receta cargada de forma asíncrona desde IndexedDB.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existingRecipe.name)
      setDescription(existingRecipe.description ?? '')
      setServings(existingRecipe.servings)
      setPrepTimeMinutes(existingRecipe.prepTimeMinutes)
      setCookTimeMinutes(existingRecipe.cookTimeMinutes)
      setRecipeIngredients(existingRecipe.ingredients)
      setSteps(
        existingRecipe.steps
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ key: newId(), text: s.text })),
      )
      setToolIds(existingRecipe.toolIds)
      setCategories(existingRecipe.categories)
      setLoadedFromExisting(true)
    }
  }, [existingRecipe, loadedFromExisting])

  function addIngredient(ingredient: Ingredient) {
    setRecipeIngredients((prev) => [
      ...prev,
      { ingredientId: ingredient.id, quantity: 100, unit: ingredient.defaultUnit, optional: false },
    ])
  }

  function updateIngredientRow(index: number, patch: Partial<RecipeIngredient>) {
    setRecipeIngredients((prev) => prev.map((ri, i) => (i === index ? { ...ri, ...patch } : ri)))
  }

  function removeIngredientRow(index: number) {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function addStep() {
    setSteps((prev) => [...prev, { key: newId(), text: '' }])
  }

  function updateStep(key: string, text: string) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, text } : s)))
  }

  function removeStep(key: string) {
    setSteps((prev) => prev.filter((s) => s.key !== key))
  }

  function moveStep(index: number, direction: -1 | 1) {
    setSteps((prev) => {
      const next = prev.slice()
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function toggleTool(toolId: string) {
    setToolIds((prev) => (prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]))
  }

  function toggleCategory(category: RecipeCategoryTag) {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const canSave = name.trim().length > 0 && recipeIngredients.length > 0 && steps.some((s) => s.text.trim())

  async function handleSave() {
    if (!canSave) return

    const recipe: Recipe = {
      id: id ?? newId(),
      name: name.trim(),
      description: description.trim() || undefined,
      servings: Math.max(1, servings),
      prepTimeMinutes: Math.max(0, prepTimeMinutes),
      cookTimeMinutes: Math.max(0, cookTimeMinutes),
      ingredients: recipeIngredients,
      steps: steps
        .filter((s) => s.text.trim())
        .map((s, i) => ({ order: i + 1, text: s.text.trim() })),
      toolIds,
      categories,
      createdAt: existingRecipe?.createdAt ?? Date.now(),
    }

    if (isEditing) {
      await db.recipes.put(recipe)
    } else {
      await db.recipes.add(recipe)
    }
    navigate(`/recipes/${recipe.id}`)
  }

  if (isEditing && !existingRecipe && loadedFromExisting === false) {
    return <div className="p-4 text-zinc-500 dark:text-zinc-400">{t('editor.loading')}</div>
  }

  return (
    <div className="px-4 pt-2 pb-10">
      <header className="mb-4 flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('recipeDetail.backAria')}
          className="tap -ml-1.5 flex h-8 w-8 items-center justify-center rounded-full text-brand-600 dark:text-brand-400"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {isEditing ? t('editor.editTitle') : t('editor.newTitle')}
        </h1>
      </header>

      <div className="space-y-6">
        <label className="block text-sm">
          <span className={sectionLabelClass}>{t('field.name')}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>

        <label className="block text-sm">
          <span className={sectionLabelClass}>{t('field.description')}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={fieldClass} />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">
            <span className={sectionLabelClass}>{t('field.servings')}</span>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 1)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            <span className={sectionLabelClass}>{t('field.prepTime')}</span>
            <input
              type="number"
              min={0}
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(Number(e.target.value) || 0)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            <span className={sectionLabelClass}>{t('field.cookTime')}</span>
            <input
              type="number"
              min={0}
              value={cookTimeMinutes}
              onChange={(e) => setCookTimeMinutes(Number(e.target.value) || 0)}
              className={fieldClass}
            />
          </label>
        </div>

        <div>
          <h2 className={sectionLabelClass}>{t('editor.categoriesHeading')}</h2>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={chipClass(categories.includes(category))}
              >
                {recipeCategoryLabel(category, t)}
              </button>
            ))}
          </div>
        </div>

        <IngredientsEditor
          rows={recipeIngredients}
          ingredientsById={ingredientsById}
          allIngredients={ingredients ?? []}
          onAdd={addIngredient}
          onUpdateRow={updateIngredientRow}
          onRemoveRow={removeIngredientRow}
        />

        <div>
          <h2 className={sectionLabelClass}>{t('editor.stepsHeading')}</h2>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.key} className="flex items-start gap-2">
                <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {index + 1}
                </span>
                <textarea
                  value={step.text}
                  onChange={(e) => updateStep(step.key, e.target.value)}
                  rows={2}
                  placeholder={t('editor.stepPlaceholder')}
                  className={`flex-1 ${fieldClass}`}
                />
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveStep(index, -1)}
                    className="tap flex h-6 w-6 items-center justify-center text-zinc-400 dark:text-zinc-500"
                    aria-label={t('editor.stepUpAria')}
                  >
                    <ChevronUpIcon className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, 1)}
                    className="tap flex h-6 w-6 items-center justify-center text-zinc-400 dark:text-zinc-500"
                    aria-label={t('editor.stepDownAria')}
                  >
                    <ChevronDownIcon className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(step.key)}
                    className="tap flex h-6 w-6 items-center justify-center text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                    aria-label={t('common.remove')}
                  >
                    <CloseIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={addStep}
            className="tap mt-2 flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2.25} />
            {t('editor.addStep')}
          </button>
        </div>

        <div>
          <h2 className={sectionLabelClass}>{t('editor.toolsHeading')}</h2>
          <div className="space-y-3">
            {TOOL_CATEGORIES.map((category) => {
              const items = (tools ?? []).filter((tool) => tool.category === category)
              if (items.length === 0) return null
              return (
                <div key={category}>
                  <p className="mb-1 px-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">{toolCategoryLabel(category, t)}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        className={chipClass(toolIds.includes(tool.id))}
                      >
                        {toolLabel(tool, t)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="tap w-full rounded-2xl bg-brand-600 py-3.5 text-[16px] font-semibold text-white shadow-sm shadow-brand-600/20 disabled:opacity-40 dark:disabled:opacity-30"
        >
          {isEditing ? t('editor.saveEdit') : t('editor.saveCreate')}
        </button>
      </div>
    </div>
  )
}

function IngredientsEditor({
  rows,
  ingredientsById,
  allIngredients,
  onAdd,
  onUpdateRow,
  onRemoveRow,
}: {
  rows: RecipeIngredient[]
  ingredientsById: Map<string, Ingredient>
  allIngredients: Ingredient[]
  onAdd: (ingredient: Ingredient) => void
  onUpdateRow: (index: number, patch: Partial<RecipeIngredient>) => void
  onRemoveRow: (index: number) => void
}) {
  const { t, language } = useI18n()
  const [search, setSearch] = useState('')
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return []
    return allIngredients.filter((i) => ingredientSearchText(i, language).includes(needle)).slice(0, 8)
  }, [search, allIngredients, language])

  async function handleQuickCreate(ingredient: Ingredient) {
    await db.ingredients.add(ingredient)
    onAdd(ingredient)
    setShowQuickCreate(false)
    setSearch('')
  }

  return (
    <div>
      <h2 className={sectionLabelClass}>{t('editor.ingredientsHeading')}</h2>

      {rows.length > 0 && (
        <ul className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
          {rows.map((row, index) => {
            const ingredient = ingredientsById.get(row.ingredientId)
            return (
              <li
                key={`${row.ingredientId}-${index}`}
                className={`flex items-center gap-2 p-2.5 ${
                  index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''
                }`}
              >
                <span className="flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
                  {ingredient ? ingredientDisplayName(ingredient, language) : '…'}
                </span>
                <input
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => onUpdateRow(index, { quantity: Number(e.target.value) || 0 })}
                  className="w-16 rounded-lg bg-zinc-100 px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <select
                  value={row.unit}
                  onChange={(e) => onUpdateRow(index, { unit: e.target.value as Unit })}
                  className="rounded-lg bg-zinc-100 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="g">{t('unit.g')}</option>
                  <option value="ml">{t('unit.ml')}</option>
                  <option value="unit">{t('unit.unit')}</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={row.optional}
                    onChange={(e) => onUpdateRow(index, { optional: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  {t('editor.optionalShort')}
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveRow(index)}
                  className="tap flex h-6 w-6 items-center justify-center text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                >
                  <CloseIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder={t('editor.searchIngredientPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={fieldClass}
        />
        {filtered.length > 0 && (
          <ul className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl bg-white p-1 shadow-lg shadow-black/10 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]">
            {filtered.map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(ingredient)
                    setSearch('')
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {ingredientDisplayName(ingredient, language)}
                  {ingredient.brand && <span className="ml-1 text-zinc-400 dark:text-zinc-500">· {ingredient.brand}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowQuickCreate((v) => !v)}
        className="tap mt-2 flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400"
      >
        {showQuickCreate ? (
          <>
            <CloseIcon className="h-4 w-4" strokeWidth={2} />
            {t('common.cancel')}
          </>
        ) : (
          <>
            <PlusIcon className="h-4 w-4" strokeWidth={2.25} />
            {t('editor.createIngredient')}
          </>
        )}
      </button>

      {showQuickCreate && <QuickCreateIngredient onCreate={handleQuickCreate} t={t} />}
    </div>
  )
}

function QuickCreateIngredient({ onCreate, t }: { onCreate: (ingredient: Ingredient) => void; t: TFunction }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<IngredientCategory>('other')
  const [defaultUnit, setDefaultUnit] = useState<Unit>('g')
  const [nutrition, setNutrition] = useState(EMPTY_NUTRITION)

  function submit() {
    if (!name.trim()) return
    onCreate({
      id: newId(),
      name: name.trim(),
      category,
      nutritionPer100g: nutrition,
      defaultUnit,
      source: 'manual',
      createdAt: Date.now(),
    })
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-zinc-100/70 p-3.5 dark:bg-zinc-900/60">
      <label className="block text-sm">
        <span className={sectionLabelClass}>{t('field.name')}</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className={sectionLabelClass}>{t('field.category')}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)} className={fieldClass}>
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c, t)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className={sectionLabelClass}>{t('field.unit')}</span>
          <select value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as Unit)} className={fieldClass}>
            <option value="g">{t('unitOption.grams')}</option>
            <option value="ml">{t('unitOption.milliliters')}</option>
            <option value="unit">{t('unitOption.units')}</option>
          </select>
        </label>
      </div>
      <NutritionFieldsEditor value={nutrition} onChange={setNutrition} />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={submit}
        className="tap w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {t('editor.addIngredientToRecipe')}
      </button>
    </div>
  )
}
