import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function Layout() {
  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <main className="page">
        <Outlet />
      </main>
      <TabBar />
    </>
  )
}
