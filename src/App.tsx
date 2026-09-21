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

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeeded().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-400">
        Cargando…
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
