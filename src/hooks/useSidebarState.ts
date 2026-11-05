import { useMatches, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

/**
 * Pinned expanded/collapsed state of the app sidebar.
 * Resets on every navigation: collapsed on focus routes, expanded otherwise.
 */
export function useSidebarState() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const focus = useMatches({
    select: (ms) => ms.some((m) => m.staticData?.focus),
  })

  const initial = !focus
  const key = `${pathname}|${focus}`
  const [state, setState] = useState({ key, expanded: initial })

  // Reset during render when the route (or its focus flag) changes.
  let expanded = state.expanded
  if (state.key !== key) {
    expanded = initial
    setState({ key, expanded })
  }

  const toggle = () => setState({ key, expanded: !expanded })
  return { expanded, toggle }
}
