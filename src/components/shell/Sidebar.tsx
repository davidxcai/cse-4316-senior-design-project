import {
  IconHandStop,
  IconHome,
  IconTargetArrow,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import UserCard from './UserCard'

const NAV = [
  { to: '/home', label: 'Home', Icon: IconHome },
  { to: '/practice', label: 'Practice', Icon: IconTargetArrow },
] as const

export default function Sidebar() {
  const { user } = useAuth()
  const [hovering, setHovering] = useState(false)

  return (
    // Slot: holds the grid column at rail width. The aside overlays wider on hover/focus.
    <div className="relative h-full w-16">
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false)
        }}
        onFocus={(e) => {
          // Only keyboard focus opens the overlay; mouse clicks are covered by hover.
          if (e.target.matches(':focus-visible')) {
            setHovering(true)
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovering(false)
        }}
        className={`absolute inset-y-0 left-0 flex flex-col gap-2 overflow-hidden whitespace-nowrap bg-base-200 p-2 transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
          hovering ? 'z-50 w-56 shadow-xl' : 'w-16'
        }`}
      >
        {/* Icons keep the same x position in both widths, so the slide only reveals labels. */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 py-2">
            <IconHandStop size={28} />
            {hovering && <span className="text-lg font-bold">signify</span>}
          </div>
        </div>

        <ul className="menu w-full grow gap-2 p-0">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="py-3"
                aria-label={hovering ? undefined : label}
                activeProps={{ className: 'menu-active' }}
              >
                <Icon size={22} />
                {hovering && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <UserCard name={user?.name ?? ''} showLabel={hovering} />
      </aside>
    </div>
  )
}
