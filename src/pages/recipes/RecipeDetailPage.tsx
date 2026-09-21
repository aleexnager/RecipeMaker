import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { calculateRecipeNutrition } from '../../lib/nutrition'
import { matchRecipe } from '../../lib/matching'
import { NutritionLabel } from '../../components/NutritionLabel'
import { formatQuantity } from '../../lib/units'
import { totalTimeMinutes } from '../../types'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [servingsOverride, setServingsOverride] = useState<number | null>(null)

  const recipe = useLiveQuery(() => (id ? db.recipes.get(id) : undefined), [id])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), [])
  const tools = useLiveQuery(() => db.tools.toArray(), [])

  const ingredientsById = useMemo(() => new Map(ingredients?.map((i) => [i.id, i]) ?? []), [ingredients])
  const toolsById = useMemo(() => new Map(tools?.map((t) => [t.id, t]) ?? []), [tools])
  const ownedToolIds = useMemo(() => new Set((tools ?? []).filter((t) => t.owned).map((t) => t.id)), [tools])

  const pantryTotals = useMemo(() => {
    const totals = new Map<string, Map<string, number>>()
    for (const item of pantryItems ?? []) {
      const byUnit = totals.get(item.ingredientId) ?? new Map<string, number>()
      byUnit.set(item.unit, (byUnit.get(item.unit) ?? 0) + item.quantity)
      totals.set(item.ingredientId, byUnit)
    }
    return totals
  }, [pantryItems])

  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, pantryTotals, ownedToolIds) : undefined),
    [recipe, pantryTotals, ownedToolIds],
  )

  const effectiveServings = servingsOverride ?? recipe?.servings ?? 1

  const nutrition = useMemo(() => {
    if (!recipe) return undefined
    return calculateRecipeNutrition({ ...recipe, servings: effectiveServings }, ingredientsById)
  }, [recipe, ingredientsById, effectiveServings])

  if (!recipe) {
    return (
      <div className="p-4">
        <p className="text-stone-500 dark:text-stone-400">Receta no encontrada.</p>
        <Link to="/recipes" className="text-brand-600 underline dark:text-brand-400">
          Volver a recetas
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${recipe!.name}"? Esta acción no se puede deshacer.`)) return
    await db.recipes.delete(recipe!.id)
    navigate('/recipes')
  }

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-stone-500 dark:text-stone-400" aria-label="Volver">
          ←
        </button>
        <h1 className="flex-1 text-xl font-semibold text-stone-900 dark:text-stone-100">{recipe.name}</h1>
        <Link to={`/recipes/${recipe.id}/edit`} className="text-sm font-medium text-brand-600 dark:text-brand-400">
          Editar
        </Link>
      </header>

      {recipe.description && <p className="mb-3 text-stone-600 dark:text-stone-400">{recipe.description}</p>}

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          ⏱ {totalTimeMinutes(recipe)} min ({recipe.prepTimeMinutes} prep + {recipe.cookTimeMinutes} cocción)
        </span>
        {match?.canMakeNow ? (
          <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">✓ Puedes hacerla ya</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Faltan ingredientes o utensilios</span>
        )}
      </div>

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">Ingredientes</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500 dark:text-stone-400">Raciones</span>
            <button
              onClick={() => setServingsOverride(Math.max(1, effectiveServings - 1))}
              className="h-6 w-6 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
            >
              −
            </button>
            <span className="w-4 text-center dark:text-stone-200">{effectiveServings}</span>
            <button
              onClick={() => setServingsOverride(effectiveServings + 1)}
              className="h-6 w-6 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
            >
              +
            </button>
          </div>
        </div>
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-white shadow-sm dark:divide-stone-800 dark:bg-stone-900">
          {recipe.ingredients.map((ri) => {
            const ingredient = ingredientsById.get(ri.ingredientId)
            const scale = effectiveServings / recipe.servings
            const missing = match?.missingIngredientIds.includes(ri.ingredientId)
            const insufficient = match?.insufficientIngredientIds.includes(ri.ingredientId)
            return (
              <li key={ri.ingredientId} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <span className="text-stone-800 dark:text-stone-200">
                  {ingredient?.name ?? 'Ingrediente eliminado'}
                  {ri.optional && <span className="ml-1 text-stone-400 dark:text-stone-500">(opcional)</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-stone-500 dark:text-stone-400">{formatQuantity(ri.quantity * scale, ri.unit)}</span>
                  {!ri.optional && missing && <span className="text-red-500 dark:text-red-400" title="No está en tu despensa">✕</span>}
                  {!ri.optional && insufficient && (
                    <span className="text-amber-500 dark:text-amber-400" title="Tienes menos cantidad de la necesaria">
                      !
                    </span>
                  )}
                  {!ri.optional && !missing && !insufficient && <span className="text-brand-600 dark:text-brand-400">✓</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {recipe.toolIds.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-100">Utensilios necesarios</h2>
          <div className="flex flex-wrap gap-2">
            {recipe.toolIds.map((toolId) => {
              const tool = toolsById.get(toolId)
              const owned = ownedToolIds.has(toolId)
              return (
                <span
                  key={toolId}
                  className={`rounded-full px-3 py-1 text-sm ${
                    owned
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {owned ? '✓ ' : ''}
                  {tool?.name ?? 'Utensilio eliminado'}
                </span>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-5">
        <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-100">Pasos</h2>
        <ol className="space-y-3">
          {recipe.steps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.order} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-stone-900">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
                  {step.order}
                </span>
                <p className="text-stone-700 dark:text-stone-300">{step.text}</p>
              </li>
            ))}
        </ol>
      </section>

      {nutrition && (
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NutritionLabel facts={nutrition.perServing} title={`Por ración (${effectiveServings} ${effectiveServings === 1 ? 'ración' : 'raciones'} en total)`} />
          <NutritionLabel facts={nutrition.total} title="Total de la receta" />
        </section>
      )}

      <button onClick={handleDelete} className="mb-8 text-sm font-medium text-red-500 dark:text-red-400">
        Eliminar receta
      </button>
    </div>
  )
}
