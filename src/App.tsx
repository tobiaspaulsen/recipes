import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RecipePage } from './pages/RecipePage'
import { RecipesPage } from './pages/RecipesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShoppingListPage } from './pages/ShoppingListPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <ShoppingListPage /> },
      { path: 'oppskrifter', element: <RecipesPage /> },
      { path: 'oppskrifter/:id', element: <RecipePage /> },
      { path: 'innstillinger', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
