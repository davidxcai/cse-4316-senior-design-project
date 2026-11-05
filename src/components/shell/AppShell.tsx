import { Outlet } from '@tanstack/react-router'
import { useSidebarState } from '../../hooks/useSidebarState'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { expanded, toggle } = useSidebarState()
  return (
    <div className="drawer drawer-open">
      <input
        id="app-sidebar"
        type="checkbox"
        className="drawer-toggle"
        checked={expanded}
        onChange={toggle}
        aria-label="Sidebar expanded"
      />
      {/* Content left edge is fixed at 16rem: expanded = w-56 slot + px-8; collapsed = w-16 rail + pl-48. Keep these sums equal so content never shifts, and past the w-56 hover overlay so it never covers content. */}
      <main
        className={`drawer-content px-8 py-6 transition-[padding] duration-200 ease-out motion-reduce:transition-none ${
          expanded ? '' : 'pl-48'
        }`}
      >
        <div className="w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
      <div className="drawer-side overflow-visible">
        <Sidebar expanded={expanded} onToggle={toggle} />
      </div>
    </div>
  )
}
