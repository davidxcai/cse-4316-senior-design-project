# AppShell

Layout for signed-in routes: daisyUI `drawer drawer-open` (always visible, desktop only) with `<Outlet/>` in `drawer-content` and `<Sidebar/>` in `drawer-side`.

The `drawer-toggle` checkbox is controlled (`checked = expanded`) so daisyUI's `is-drawer-open:`/`is-drawer-close:` variants follow React state. State comes from `useSidebarState`, which resets on every navigation: collapsed on routes whose match has `staticData.focus`, expanded otherwise. Nothing is persisted (SB.6 cut).

## Content area
`drawer-content` is a `<main>` with `pr-8 py-6` and a `max-w-5xl` wrapper around `<Outlet/>`, left-aligned against the sidebar, so pages don't stretch to the full width. While collapsed it uses `pl-40` (10rem). That's exactly how far the hover overlay extends past the rail (`w-56` − `w-16`), so the overlay ends flush with the content and never covers it. The padding transitions along with the sidebar's slide. Pages shouldn't add their own outer padding.
