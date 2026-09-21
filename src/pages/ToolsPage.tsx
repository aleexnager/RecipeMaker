import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { newId } from '../lib/id'
import { TOOL_CATEGORIES, type ToolCategory } from '../types'

export function ToolsPage() {
  const tools = useLiveQuery(() => db.tools.toArray(), [])
  const [newToolName, setNewToolName] = useState('')

  const grouped = useMemo(() => {
    if (!tools) return []
    const byCategory = new Map<ToolCategory, typeof tools>()
    for (const tool of tools) {
      const list = byCategory.get(tool.category) ?? []
      list.push(tool)
      byCategory.set(tool.category, list)
    }
    return TOOL_CATEGORIES.map((category) => [category, byCategory.get(category) ?? []] as const).filter(
      ([, list]) => list.length > 0,
    )
  }, [tools])

  const ownedCount = tools?.filter((t) => t.owned).length ?? 0

  async function toggleOwned(id: string, owned: boolean) {
    await db.tools.update(id, { owned })
  }

  async function addCustomTool() {
    const name = newToolName.trim()
    if (!name) return
    await db.tools.add({
      id: newId(),
      name,
      category: 'Otros utensilios',
      owned: true,
      custom: true,
    })
    setNewToolName('')
  }

  async function removeCustomTool(id: string) {
    await db.tools.delete(id)
  }

  return (
    <div className="p-4">
      <header className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Mis utensilios</h1>
      </header>
      <p className="mb-4 text-sm text-stone-500">
        {ownedCount} de {tools?.length ?? 0} marcados como disponibles. Se usan para saber qué recetas puedes cocinar.
      </p>

      <div className="space-y-5">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{category}</h2>
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-white shadow-sm">
              {items.map((tool) => (
                <li key={tool.id} className="flex items-center justify-between px-3 py-2.5">
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={tool.owned}
                      onChange={(e) => toggleOwned(tool.id, e.target.checked)}
                      className="h-5 w-5 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-stone-800">{tool.name}</span>
                  </label>
                  {tool.custom && (
                    <button
                      onClick={() => removeCustomTool(tool.id)}
                      aria-label="Eliminar"
                      className="text-stone-300 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Añadir otro utensilio</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="p.ej. Molde de bizcocho"
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTool()}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={addCustomTool}
            disabled={!newToolName.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
      </section>
    </div>
  )
}
