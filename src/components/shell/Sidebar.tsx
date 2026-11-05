import {
  IconHandStop,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTargetArrow,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import UserCard from './UserCard'

type Props = { expanded: boolean; onToggle: () => void }

const NAV = [
  { to: '/home', label: 'Home', Icon: IconHome },
  { to: '/practice', label: 'Practice', Icon: IconTargetArrow },
] as const

export default function Sidebar({ expanded, onToggle }: Props) {
  const { user } = useAuth()
  const [hovering, setHovering] = useState(false)
  // Set when the toggle is clicked; blocks hover-expand until the pointer leaves.
  const [suppressed, setSuppressed] = useState(false)
  // Full panel shows when pinned open, or when hover-overlaying the collapsed rail.
  const open = hovering && !suppressed
  const full = expanded || open
  const overlay = !expanded && open

  const handleToggle = () => {
    setHovering(false)
    setSuppressed(true)
    onToggle()
  }

  return (
    // Slot: holds the grid column at rail width (collapsed) or panel width (pinned open).
    // Width transition must match AppShell's padding transition (same duration/easing) so slot + padding stays constant and content doesn't jump.
    <div
      className={`relative h-full transition-[width] duration-200 ease-out motion-reduce:transition-none ${
        expanded ? 'w-56' : 'w-16'
      }`}
    >
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false)
          setSuppressed(false)
        }}
        onFocus={(e) => {
          // Only keyboard focus opens the overlay; mouse clicks are covered by hover.
          if (e.target.matches(':focus-visible')) {
            setSuppressed(false)
            setHovering(true)
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovering(false)
        }}
        className={`absolute inset-y-0 left-0 flex flex-col gap-2 overflow-hidden whitespace-nowrap bg-base-200 p-2 transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
          full ? 'w-56' : 'w-16'
        } ${overlay ? 'z-50 shadow-xl' : ''}`}
      >
        {/* Icons keep the same x position in both widths, so the slide only reveals labels. */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 py-2">
            <IconHandStop size={28} />
            {full && <span className="text-lg font-bold">signify</span>}
          </div>
          {full && (
            <button
              type="button"
              className="btn btn-ghost btn-circle"
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={handleToggle}
            >
              {expanded ? (
                <IconLayoutSidebarLeftCollapse size={22} />
              ) : (
                <IconLayoutSidebarLeftExpand size={22} />
              )}
            </button>
          )}
        </div>

        <ul className="menu w-full grow p-0">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                aria-label={full ? undefined : label}
                activeProps={{ className: 'menu-active' }}
              >
                <Icon size={22} />
                {full && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <UserCard name={user?.name ?? ''} showLabel={full} />
      </aside>
    </div>
  )
}
