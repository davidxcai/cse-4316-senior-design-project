# Sidebar

Logo, Home/Practice nav (daisyUI `menu`), collapse toggle, user card → `/profile`. Rendered inside AppShell's `drawer-side`.

## Hover-expand overlay (the custom part)
daisyUI's icon-rail resizes the drawer grid column, so expanding it would push page content. SB.3 requires an overlay instead. So:
- An outer slot div owns the column width (`w-16` collapsed, `w-56` pinned open, driven by the `expanded` prop, not daisyUI's `is-drawer-open:` variant, which is always true under `drawer-open`). Hovering never changes it.
- The inner `aside` is `absolute`; on `mouseenter` on the aside (local `hovering` state) it widens to `w-56` with `z-50 shadow-xl`, floating over the page. `mouseleave` returns it to rail width.
- Mouse and focus handlers live on the `aside`, not the slot.
- AppShell's `drawer-side` must keep an unconditional `overflow-visible` (not `is-drawer-close:`). daisyUI's `drawer-open` sets `overflow-y: auto`, which also clips sideways overflow, so without it the widened panel is cut off at rail width and hover appears to do nothing. Making it conditional on the closed state is worse: clicking expand flips it instantly, clipping the hover panel to the still-growing slot so it visibly collapses and re-opens.
- Labels are rendered from React state (`expanded || hovering`) rather than `is-drawer-close:hidden`, because the drawer variant can't know about hover.

## Toggle while hovering
Clicking the toggle clears `hovering` and sets `suppressed`, so « collapses to the rail immediately instead of staying as an overlay under the pointer. Hover-expand resumes after `mouseleave` clears `suppressed`.

## Keyboard access
Tabbing into the sidebar (`:focus-visible` focus) opens the overlay like hover, revealing labels and the » toggle; focus leaving the `aside` (`relatedTarget` outside) closes it. Keyboard focus also clears `suppressed`, since a keyboard user never triggers `mouseleave`. Mouse-click focus is ignored so it can't undo a collapse.

No tooltips: hover-expand already reveals labels. Collapsed items carry `aria-label`. The toggle only appears when the full panel shows; in the collapsed rail the only way to pin open is hovering, then ».

## Slide animation
The `aside` transitions `width` (200ms ease-out; off under `prefers-reduced-motion`), so pinning, collapsing and the hover overlay all slide. The slot's column width transitions with the same duration and easing as AppShell's padding, so slot width + padding stays constant and content doesn't jump. Keep the two in sync. The `aside` is `overflow-hidden whitespace-nowrap` and icons sit at the same x position in both widths, so the slide just reveals or clips the labels instead of re-centering icons.
