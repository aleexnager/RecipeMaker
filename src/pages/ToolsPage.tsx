import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { newId } from '../lib/id'
import { CloseIcon, PlusIcon } from '../components/icons'
import { Switch } from '../components/Switch'
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
    <div className="px-4 pt-2">
      <header className="mb-1">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Utensilios</h1>
      </header>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
        {ownedCount} de {tools?.length ?? 0} disponibles · se usan para saber qué recetas puedes cocinar.
      </p>

      <div className="space-y-6">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {category}
            </h2>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.03] dark:bg-zinc-900">
              {items.map((tool, index) => (
                <li
                  key={tool.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 ${
                    index > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''
                  }`}
                >
                  <span className="text-zinc-800 dark:text-zinc-200">{tool.name}</span>
                  <div className="flex items-center gap-2">
                    {tool.custom && (
                      <button
                        onClick={() => removeCustomTool(tool.id)}
                        aria-label="Eliminar"
                        className="tap flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                      >
                        <CloseIcon className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}
                    <Switch checked={tool.owned} onChange={(owned) => toggleOwned(tool.id, owned)} label={tool.name} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-6 mb-4">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Añadir otro utensilio
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="p.ej. Molde de bizcocho"
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTool()}
            className="flex-1 rounded-xl border-0 bg-white px-3.5 py-2.5 shadow-sm shadow-black/[0.03] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]"
          />
          <button
            onClick={addCustomTool}
            disabled={!newToolName.trim()}
            aria-label="Añadir utensilio"
            className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-40"
          >
            <PlusIcon className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      </section>
    </div>
  )
}
