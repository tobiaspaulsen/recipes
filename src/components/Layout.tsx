import { Outlet, ScrollRestoration, useMatches } from 'react-router-dom'
import { useSession } from '../lib/useSession'
import { LoginForm } from './LoginForm'
import { TabBar } from './TabBar'

export function Layout() {
  const { signedIn, loading } = useSession()
  const fullscreen = useMatches().some((match) => (match.handle as { fullscreen?: boolean } | undefined)?.fullscreen)

  if (loading) return null

  if (!signedIn) {
    return (
      <main className="page login-page">
        <h1 className="page-title">Oppskrifter</h1>
        <p className="muted">Logg inn for å se handlelisten og oppskriftene.</p>
        <LoginForm />
      </main>
    )
  }

  return (
    <>
      <main className="page">
        <Outlet />
      </main>
      {!fullscreen && <TabBar />}
      <ScrollRestoration />
    </>
  )
}
