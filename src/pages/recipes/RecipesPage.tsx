import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { matchAndFilterRecipes, type RecipeMatch } from '../../lib/matching'
import { CheckCircleIcon, ClockIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { Switch } from '../../components/Switch'
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
    <div className="px-4 pt-2">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Recetas</h1>
        <Link
          to="/recipes/new"
          aria-label="Nueva receta"
          className="tap flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
        >
          <PlusIcon className="h-5 w-5" strokeWidth={2} />
        </Link>
      </header>

      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
        <input
          type="text"
          placeholder="Buscar receta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-0 bg-zinc-200/60 py-2.5 pl-9 pr-3 text-[15px] outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-zinc-800/70 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setMaxTime(opt.value)}
            className={`tap shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              maxTime === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-zinc-200/60 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {RECIPE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`tap shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              activeCategories.includes(category)
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                : 'bg-zinc-200/60 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
        <label className="flex items-center justify-between px-3.5 py-2.5 text-[15px] text-zinc-700 dark:text-zinc-300">
          Solo lo que puedo hacer ya
          <Switch checked={onlyMakeableNow} onChange={setOnlyMakeableNow} label="Solo recetas que puedo hacer ya" />
        </label>
        <label className="flex items-center justify-between border-t border-black/[0.06] px-3.5 py-2.5 text-[15px] text-zinc-700 dark:border-white/[0.06] dark:text-zinc-300">
          Solo con mis utensilios
          <Switch checked={requireOwnedTools} onChange={setRequireOwnedTools} label="Solo recetas con mis utensilios" />
        </label>
      </div>

      {matches.length === 0 && (
        <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">No hay recetas que coincidan con estos filtros.</p>
      )}

      <ul className="space-y-3 pb-2">
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
        className="tap block rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.03] dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{recipe.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <ClockIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {totalTimeMinutes(recipe)} min
          </span>
        </div>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{recipe.description}</p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {match.canMakeNow ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              <CheckCircleIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Puedes hacerla ya
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Te falta{missingCount === 1 ? '' : 'n'} {missingCount} ingrediente{missingCount === 1 ? '' : 's'}
            </span>
          )}
          {match.missingToolIds.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Falta utensilio
            </span>
          )}
          {recipe.categories.map((c) => (
            <span key={c} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {c}
            </span>
          ))}
        </div>
      </Link>
    </li>
  )
}
