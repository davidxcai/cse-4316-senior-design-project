import { Link, Outlet } from '@tanstack/react-router'
import { IconHandStop } from '@tabler/icons-react'

export default function PublicShell() {
  return (
    <>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">
            <IconHandStop size={26} />
            signify
          </Link>
        </div>
        <div className="flex gap-2">
          <Link to="/sign-in" className="btn btn-ghost">Sign in</Link>
          <Link to="/sign-up" className="btn btn-primary">Sign up</Link>
        </div>
      </div>
      <Outlet />
    </>
  )
}
