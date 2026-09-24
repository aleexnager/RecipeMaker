import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { calculateRecipeNutrition } from '../../lib/nutrition'
import { buildPantryTotals, matchRecipe } from '../../lib/matching'
import { NutritionLabel } from '../../components/NutritionLabel'
import { formatQuantity } from '../../lib/units'
import { useI18n } from '../../lib/i18n/context'
import {
  ingredientDisplayName,
  recipeDisplayDescription,
  recipeDisplayName,
  recipeDisplaySteps,
  toolLabel,
} from '../../lib/i18n/labels'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from '../../components/icons'
import { totalTimeMinutes } from '../../types'

export function RecipeDetailPage() {
  const { t, language } = useI18n()
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

  const pantryTotals = useMemo(() => buildPantryTotals(pantryItems ?? [], ingredientsById), [pantryItems, ingredientsById])

  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, pantryTotals, ownedToolIds, ingredientsById) : undefined),
    [recipe, pantryTotals, ownedToolIds, ingredientsById],
  )

  const effectiveServings = servingsOverride ?? recipe?.servings ?? 1

  const nutrition = useMemo(() => {
    if (!recipe) return undefined
    return calculateRecipeNutrition(recipe, ingredientsById, effectiveServings)
  }, [recipe, ingredientsById, effectiveServings])

  if (!recipe) {
    return (
      <div className="p-4">
        <p className="text-zinc-500 dark:text-zinc-400">{t('recipeDetail.notFound')}</p>
        <Link to="/recipes" className="text-brand-600 underline dark:text-brand-400">
          {t('recipeDetail.backToRecipes')}
        </Link>
      </div>
    )
  }

  const displaySteps = recipeDisplaySteps(recipe, language)

  async function handleDelete() {
    if (!confirm(t('recipeDetail.confirmDelete', { name: recipeDisplayName(recipe!, language) }))) return
    await db.recipes.delete(recipe!.id)
    navigate('/recipes')
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
        <h1 className="flex-1 truncate text-[19px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {recipeDisplayName(recipe, language)}
        </h1>
        <Link
          to={`/recipes/${recipe.id}/edit`}
          aria-label={t('recipeDetail.editAria')}
          className="tap flex h-8 w-8 items-center justify-center rounded-full text-brand-600 dark:text-brand-400"
        >
          <PencilIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      </header>

      {recipeDisplayDescription(recipe, language) && (
        <p className="mb-3 text-zinc-600 dark:text-zinc-400">{recipeDisplayDescription(recipe, language)}</p>
      )}

      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <ClockIcon className="h-3.5 w-3.5" strokeWidth={2} />
          {t('recipeDetail.timeSummary', {
            total: totalTimeMinutes(recipe),
            prep: recipe.prepTimeMinutes,
            cook: recipe.cookTimeMinutes,
          })}
        </span>
        {match?.canMakeNow ? (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <CheckCircleIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {t('recipes.canMakeNow')}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {t('recipeDetail.missingStuff')}
          </span>
        )}
      </div>

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('recipeDetail.ingredientsHeading')}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{t('recipeDetail.servingsLabel')}</span>
            <button
              onClick={() => setServingsOverride(Math.max(1, effectiveServings - 1))}
              aria-label={t('recipeDetail.lessServingsAria')}
              className="tap flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <MinusIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <span className="w-4 text-center tabular-nums text-zinc-800 dark:text-zinc-200">{effectiveServings}</span>
            <button
              onClick={() => setServingsOverride(effectiveServings + 1)}
              aria-label={t('recipeDetail.moreServingsAria')}
              className="tap flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
          {recipe.ingredients.map((ri, index) => {
            const ingredient = ingredientsById.get(ri.ingredientId)
            const scale = effectiveServings / recipe.servings
            const missing = match?.missingIngredientIds.includes(ri.ingredientId)
            const insufficient = match?.insufficientIngredientIds.includes(ri.ingredientId)
            return (
              <li
                key={ri.ingredientId}
                className={`flex items-center justify-between px-3.5 py-2.5 text-[15px] ${
                  index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''
                }`}
              >
                <span className="text-zinc-800 dark:text-zinc-200">
                  {ingredient ? ingredientDisplayName(ingredient, language) : t('pantry.deletedIngredient')}
                  {ri.optional && <span className="ml-1 text-zinc-400 dark:text-zinc-500">{t('recipeDetail.optional')}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">{formatQuantity(ri.quantity * scale, ri.unit, t)}</span>
                  {!ri.optional && missing && (
                    <XCircleIcon
                      className="h-4 w-4 text-red-500 dark:text-red-400"
                      strokeWidth={2}
                      aria-label={t('recipeDetail.missingFromPantryAria')}
                    />
                  )}
                  {!ri.optional && insufficient && (
                    <AlertCircleIcon
                      className="h-4 w-4 text-amber-500 dark:text-amber-400"
                      strokeWidth={2}
                      aria-label={t('recipeDetail.insufficientAria')}
                    />
                  )}
                  {!ri.optional && !missing && !insufficient && (
                    <CheckIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2.25} />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {recipe.toolIds.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('recipeDetail.toolsHeading')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recipe.toolIds.map((toolId) => {
              const tool = toolsById.get(toolId)
              const owned = ownedToolIds.has(toolId)
              return (
                <span
                  key={toolId}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                    owned
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {owned && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {tool ? toolLabel(tool, t) : t('recipeDetail.deletedTool')}
                </span>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-5">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('recipeDetail.stepsHeading')}
        </h2>
        <ol className="space-y-2.5">
          {displaySteps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.order} className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
                  {step.order}
                </span>
                <p className="text-[15px] text-zinc-700 dark:text-zinc-300">{step.text}</p>
              </li>
            ))}
        </ol>
      </section>

      {nutrition && (
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NutritionLabel facts={nutrition.perServing} title={t('recipeDetail.perServingTitle', { servings: effectiveServings })} />
          <NutritionLabel facts={nutrition.total} title={t('recipeDetail.totalTitle')} />
        </section>
      )}

      <button
        onClick={handleDelete}
        className="tap flex items-center gap-1.5 text-sm font-medium text-red-500 dark:text-red-400"
      >
        <TrashIcon className="h-4 w-4" strokeWidth={2} />
        {t('recipeDetail.deleteButton')}
      </button>
    </div>
  )
}
