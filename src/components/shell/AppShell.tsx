import { Outlet } from '@tanstack/react-router'
import Sidebar from './Sidebar'

export default function AppShell() {
  return (
    <div className="drawer drawer-open">
      <input id="app-sidebar" type="checkbox" className="drawer-toggle" aria-label="Sidebar" />
      {/* Sidebar is a w-16 rail that overlays to w-56 on hover. pl-48 keeps the content left edge at 16rem, past the hover overlay so it never covers content. */}
      <main className="drawer-content py-6 px-48">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <div className="drawer-side overflow-visible">
        <Sidebar />
      </div>
    </div>
  )
}
