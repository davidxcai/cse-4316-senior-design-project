# AppShell

Layout for signed-in routes: daisyUI `drawer drawer-open` (always visible, desktop only) with `<Outlet/>` in `drawer-content` and `<Sidebar/>` in `drawer-side`.

The sidebar has no pinned state: it is always a `w-16` rail and overlays to `w-56` only while hovered or keyboard-focused. The `drawer-toggle` checkbox is unused (`drawer-open` keeps it visible).

## Content area
`drawer-content` is a `<main>` with `px-48 py-6` (12rem each side) around `<Outlet/>`, so left and right margins are equal. The left 12rem after the `w-16` rail puts the content edge at 16rem, past the `w-56` hover overlay, which never covers content. Pages shouldn't add their own outer padding.
