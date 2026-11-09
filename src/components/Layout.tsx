import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function Layout() {
  return (
    <>
      <main className="page">
        <Outlet />
      </main>
      <TabBar />
    </>
  )
}
