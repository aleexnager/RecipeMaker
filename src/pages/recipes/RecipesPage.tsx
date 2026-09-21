import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { matchAndFilterRecipes, type RecipeMatch } from '../../lib/matching'
import { totalTimeMinutes, RECIPE_CATEGORIES, type RecipeCategoryTag } from '../../types'

const TIME_OPTIONS = [
  { label: 'Cualquier tiempo', value: undefined },
  { label: 'Hasta 15 min', value: 15 },
  { label: 'Hasta 30 min', value: 30 },
  { label: 'Hasta 45 min', value: 45 },
  { label: 'Hasta 60 min', value: 60 },
]

export function RecipesPage() {
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), [])
  const tools = useLiveQuery(() => db.tools.toArray(), [])

  const [search, setSearch] = useState('')
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined)
  const [onlyMakeableNow, setOnlyMakeableNow] = useState(false)
  const [requireOwnedTools, setRequireOwnedTools] = useState(false)
  const [activeCategories, setActiveCategories] = useState<RecipeCategoryTag[]>([])

  const ownedToolIds = useMemo(
    () => new Set((tools ?? []).filter((t) => t.owned).map((t) => t.id)),
    [tools],
  )

  const matches = useMemo(() => {
    if (!recipes || !pantryItems) return []
    return matchAndFilterRecipes(recipes, pantryItems, ownedToolIds, {
      maxTotalTimeMinutes: maxTime,
      onlyMakeableNow,
      requireOwnedTools,
      categories: activeCategories,
      searchText: search,
    })
  }, [recipes, pantryItems, ownedToolIds, maxTime, onlyMakeableNow, requireOwnedTools, activeCategories, search])

  function toggleCategory(category: RecipeCategoryTag) {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Recetas</h1>
        <Link
          to="/recipes/new"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white active:bg-brand-700"
        >
          + Nueva
        </Link>
      </header>

      <input
        type="text"
        placeholder="Buscar receta…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
      />

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setMaxTime(opt.value)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              maxTime === opt.value
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-stone-300 bg-white text-stone-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {RECIPE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              activeCategories.includes(category)
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-stone-300 bg-white text-stone-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyMakeableNow}
            onChange={(e) => setOnlyMakeableNow(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          Solo recetas que puedo hacer ya
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={requireOwnedTools}
            onChange={(e) => setRequireOwnedTools(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          Solo recetas con mis utensilios
        </label>
      </div>

      {matches.length === 0 && (
        <p className="mt-10 text-center text-stone-500">No hay recetas que coincidan con estos filtros.</p>
      )}

      <ul className="space-y-3">
        {matches.map((match) => (
          <RecipeCard key={match.recipe.id} match={match} />
        ))}
      </ul>
    </div>
  )
}

function RecipeCard({ match }: { match: RecipeMatch }) {
  const { recipe } = match
  const missingCount = match.missingIngredientIds.length + match.insufficientIngredientIds.length

  return (
    <li>
      <Link
        to={`/recipes/${recipe.id}`}
        className="block rounded-xl bg-white p-4 shadow-sm active:bg-stone-50"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900">{recipe.name}</h3>
          <span className="shrink-0 text-sm text-stone-500">⏱ {totalTimeMinutes(recipe)} min</span>
        </div>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">{recipe.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {match.canMakeNow ? (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
              ✓ Puedes hacerla ya
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              Te falta{missingCount === 1 ? '' : 'n'} {missingCount} ingrediente{missingCount === 1 ? '' : 's'}
            </span>
          )}
          {match.missingToolIds.length > 0 && (
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
              Falta utensilio
            </span>
          )}
          {recipe.categories.map((c) => (
            <span key={c} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
              {c}
            </span>
          ))}
        </div>
      </Link>
    </li>
  )
}
