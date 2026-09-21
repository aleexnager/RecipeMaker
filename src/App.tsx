import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PantryPage } from './pages/pantry/PantryPage'
import { AddIngredientPage } from './pages/pantry/AddIngredientPage'
import { ToolsPage } from './pages/ToolsPage'
import { RecipesPage } from './pages/recipes/RecipesPage'
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage'
import { RecipeEditorPage } from './pages/recipes/RecipeEditorPage'
import { ensureSeeded } from './db/seed'
import { runMigrations } from './db/migrations'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeeded()
      .then(() => runMigrations())
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-black">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-zinc-300 border-t-brand-500 dark:border-zinc-700 dark:border-t-brand-400" />
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<RecipeEditorPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/pantry/add" element={<AddIngredientPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="*" element={<Navigate to="/recipes" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
