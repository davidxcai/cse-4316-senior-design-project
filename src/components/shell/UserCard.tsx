import { IconChevronRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { initials } from '../../domain/initials'

type Props = { name: string; showLabel: boolean }


export default function UserCard({ name, showLabel }: Props) {
  return (
    <Link
      to="/profile"
      aria-label={showLabel ? undefined : name || 'Profile'}
      className={`flex items-center gap-3 rounded-box hover:bg-base-300 ${showLabel ? 'p-2' : 'p-1'}`}
    >
      <div className="avatar avatar-placeholder">
        <div className="w-10 rounded-full bg-neutral text-neutral-content">
          <span>{initials(name)}</span>
        </div>
      </div>
      {showLabel && (
        <>
          <span className="flex-1 truncate">{name}</span>
          <IconChevronRight size={18} />
        </>
      )}
    </Link>
  )
}
