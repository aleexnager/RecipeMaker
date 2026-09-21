import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { newId } from '../../lib/id'
import { NutritionFieldsEditor } from '../../components/NutritionFieldsEditor'
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

interface DraftStep {
  key: string
  text: string
}

export function RecipeEditorPage() {
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
    return <div className="p-4 text-stone-500 dark:text-stone-400">Cargando…</div>
  }

  return (
    <div className="p-4 pb-10">
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-stone-500 dark:text-stone-400" aria-label="Volver">
          ←
        </button>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{isEditing ? 'Editar receta' : 'Nueva receta'}</h1>
      </header>

      <div className="space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Nombre *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-stone-600 dark:text-stone-300">Raciones</span>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 1)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-stone-600 dark:text-stone-300">Prep. (min)</span>
            <input
              type="number"
              min={0}
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-stone-600 dark:text-stone-300">Cocción (min)</span>
            <input
              type="number"
              min={0}
              value={cookTimeMinutes}
              onChange={(e) => setCookTimeMinutes(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">Categorías</h2>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  categories.includes(category)
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                }`}
              >
                {category}
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
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">Pasos *</h2>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.key} className="flex items-start gap-2">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {index + 1}
                </span>
                <textarea
                  value={step.text}
                  onChange={(e) => updateStep(step.key, e.target.value)}
                  rows={2}
                  placeholder="Describe este paso…"
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveStep(index, -1)} className="text-stone-400 dark:text-stone-500" aria-label="Subir">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveStep(index, 1)} className="text-stone-400 dark:text-stone-500" aria-label="Bajar">
                    ↓
                  </button>
                  <button type="button" onClick={() => removeStep(step.key)} className="text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400" aria-label="Eliminar">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={addStep} className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400">
            + Añadir paso
          </button>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">Utensilios necesarios</h2>
          <div className="space-y-3">
            {TOOL_CATEGORIES.map((category) => {
              const items = (tools ?? []).filter((t) => t.category === category)
              if (items.length === 0) return null
              return (
                <div key={category}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          toolIds.includes(tool.id)
                            ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                            : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                        }`}
                      >
                        {tool.name}
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
          className="w-full rounded-xl bg-brand-600 py-3 font-medium text-white disabled:opacity-40 dark:disabled:opacity-30"
        >
          {isEditing ? 'Guardar cambios' : 'Crear receta'}
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
  const [search, setSearch] = useState('')
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return []
    return allIngredients.filter((i) => i.name.toLowerCase().includes(needle)).slice(0, 8)
  }, [search, allIngredients])

  async function handleQuickCreate(ingredient: Ingredient) {
    await db.ingredients.add(ingredient)
    onAdd(ingredient)
    setShowQuickCreate(false)
    setSearch('')
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">Ingredientes *</h2>

      <ul className="mb-3 space-y-2">
        {rows.map((row, index) => {
          const ingredient = ingredientsById.get(row.ingredientId)
          return (
            <li key={`${row.ingredientId}-${index}`} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-stone-900">
              <span className="flex-1 truncate text-sm text-stone-800 dark:text-stone-200">{ingredient?.name ?? '…'}</span>
              <input
                type="number"
                min={0}
                value={row.quantity}
                onChange={(e) => onUpdateRow(index, { quantity: Number(e.target.value) || 0 })}
                className="w-20 rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
              <select
                value={row.unit}
                onChange={(e) => onUpdateRow(index, { unit: e.target.value as Unit })}
                className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="unit">ud.</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={row.optional}
                  onChange={(e) => onUpdateRow(index, { optional: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600 dark:bg-stone-800"
                />
                Opc.
              </label>
              <button type="button" onClick={() => onRemoveRow(index)} className="text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400">
                ✕
              </button>
            </li>
          )
        })}
      </ul>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar ingrediente para añadir…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        {filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            {filtered.map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(ingredient)
                    setSearch('')
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {ingredient.name}
                  {ingredient.brand && <span className="ml-1 text-stone-400 dark:text-stone-500">· {ingredient.brand}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowQuickCreate((v) => !v)}
        className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400"
      >
        {showQuickCreate ? 'Cancelar' : '+ Crear ingrediente nuevo'}
      </button>

      {showQuickCreate && <QuickCreateIngredient onCreate={handleQuickCreate} />}
    </div>
  )
}

function QuickCreateIngredient({ onCreate }: { onCreate: (ingredient: Ingredient) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<IngredientCategory>('Otros')
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
    <div className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800/50">
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600 dark:text-stone-300">Nombre *</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Unidad</span>
          <select
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value as Unit)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="g">Gramos</option>
            <option value="ml">Mililitros</option>
            <option value="unit">Unidades</option>
          </select>
        </label>
      </div>
      <NutritionFieldsEditor value={nutrition} onChange={setNutrition} />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={submit}
        className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white disabled:opacity-40"
      >
        Añadir ingrediente a la receta
      </button>
    </div>
  )
}
