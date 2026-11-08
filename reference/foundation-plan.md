# Foundation Plan

Goal: the app skeleton everything else plugs into. That's routing, the two shells, the sidebar, auth gating, and the data and recognition providers. No feature pages yet; each route renders a placeholder.

Sources: `reference/component-tree.md` (§2 shells and routes, §3 sidebar, §6 stack), `reference/wireframes.md` (§0 sidebar states), the `signify-ui` skill.

## Current state

- Vite 8, React 19, Tailwind 4, daisyUI 5. `src/App.tsx` is the single-page recognition demo with the Mirror toggle.
- No router, query client, Supabase client or icon set installed.
- `.env.local` holds only `VERCEL_OIDC_TOKEN`. **There's no Supabase project or keys yet.**
- `src/recognition/` doesn't exist yet. The ML session is building it (stub first).

---

## Phase 1: Dependencies and config

| Package | Purpose |
|---------|---------|
| `@tanstack/react-router` | routing |
| `@tanstack/router-plugin` (dev) | file-based route generation via the Vite plugin |
| `@tanstack/react-query` | server state |
| ~~`@supabase/supabase-js`~~ | deferred: auth is a stub in this pass |
| `@tabler/icons-react` | icons |
| `@tanstack/react-router-devtools`, `@tanstack/react-query-devtools` (dev) | optional, dev only |

- Add the router plugin to `vite.config.ts` **before** `react()`. Keep `basicSsl`, since camera access over a LAN IP needs HTTPS.
- Check that each package's current release supports Vite 8 and React 19 before installing.
- Zustand is **not** installed yet (decision: only if needed).

## Phase 2: Routing (file-based)

```
src/routes/
  __root.tsx              createRootRouteWithContext<{ auth, queryClient }>
  _public.tsx             PublicShell; beforeLoad: signed in → redirect to /home
  _public/index.tsx       /           LandingPage (placeholder)
  _public/sign-in.tsx     /sign-in
  _public/sign-up.tsx     /sign-up
  _app.tsx                AppShell; beforeLoad: signed out → redirect to /sign-in
  _app/home.tsx           /home
  _app/unit.$unitId.tsx   /unit/:unitId
  _app/lesson.$lessonId.tsx  /lesson/:lessonId   staticData: { focus: true }
  _app/practice.tsx       /practice                (session sets focus itself)
  _app/profile.tsx        /profile
  dev/test.tsx            /dev/test        current demo, no guard, not linked
```

- **URL change from the component tree:** the landing page owns `/`, so signed-in Home moves to `/home`. A signed-in visitor to `/` is redirected to `/home`. A fresh signed-in visit lands on Home [SB.7].
- Auth guards live in `beforeLoad`, never in components, so protected content never flashes.
- Register the router type (`declare module '@tanstack/react-router'`).
- `defaultPreload: 'intent'`; a global not-found page (icon + "Not found").

## Phase 3: Providers (`src/main.tsx`)

```
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>                 Supabase session → { user, status }
      <RecognizerProvider>         from src/recognition (ML session); nothing loads until start()
        <RouterProvider router context={{ auth, queryClient }} />
```

- `AuthProvider` exposes `{ user, status: loading | signed-in | signed-out, signIn, signOut }`. **This pass: a stub** with a dev toggle. Later it gets swapped for Supabase (`onAuthStateChange`, client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`) with no changes to consumers.
- The router waits for anything but `loading` before resolving guards.
- `RecognizerProvider` comes from the ML session. Until its stub lands, that line is left out.

## Phase 4: Shells

### PublicShell (`_public.tsx`)
- daisyUI `navbar`: logo on the left; Sign in (`btn btn-ghost`) and Sign up (`btn btn-primary`) on the right [LP.1–2].
- `<Outlet />` below.

### AppShell (`_app.tsx`)
daisyUI `drawer drawer-open` with its built-in icon-rail pattern (`is-drawer-open:` / `is-drawer-close:` variants):

```
<div class="drawer drawer-open">
  <input id="app-sidebar" type="checkbox" class="drawer-toggle" />   ← controlled by React
  <div class="drawer-content"> <Outlet /> </div>
  <div class="drawer-side is-drawer-close:overflow-visible">
    <Sidebar />
  </div>
</div>
```

- `drawer-open` keeps the sidebar always visible (desktop only; mobile is out of scope [1.2]).
- The checkbox is a controlled input: `checked = expanded`.
- On each navigation, `expanded` resets from the route: focus routes (`staticData.focus`) start collapsed [SB.4], all others start expanded. No persistence [SB.6 cut].

## Phase 5: Sidebar

Built from daisyUI parts: `menu` for nav, `avatar` (placeholder initials) for the user card, `btn btn-ghost btn-circle` for the toggle. Icons from Tabler.

| Part | daisyUI | Tabler icon (proposed) |
|------|---------|-------------------------|
| Logo | text + icon | `IconHandStop` |
| Home | `menu` item, `menu-active` on match | `IconHome` |
| Practice | `menu` item | `IconTargetArrow` |
| Collapse toggle « / » | `btn btn-ghost btn-circle` | `IconLayoutSidebarLeftCollapse` / `…Expand` |
| User card → /profile | `avatar avatar-placeholder` + name + chevron | `IconChevronRight` |

- Collapsed: labels hidden (`is-drawer-close:hidden`). Icon-only items get `aria-label`. **No tooltips**, since hover-expand replaces them and a tooltip would just repeat the label (`signify-ui` §1).
- **Hover-expand overlay [SB.3] is the one custom behavior.** daisyUI's rail resizes the grid column, which would push the page content. To overlay instead:
  - the `drawer-side` column stays rail-width while collapsed;
  - on `mouseenter`, the inner panel gets `absolute` + full width + `z` + shadow;
  - on `mouseleave`, it returns to rail width.

  It's driven by a `hovering` flag in local state and styled with Tailwind on the daisyUI panel. That's a custom component, so it needs its doc file explaining why.
- Active link: TanStack `Link` with `activeProps={{ className: 'menu-active' }}`.
- Notifications bell is **not** built [2.14 later].

## Phase 6: Placeholders and cleanup

- Each route renders a page with only its name, so routing, guards and shells can be checked.
- The current demo moves from `src/App.tsx` to a dev-only route (`/dev/test`) so the ML session keeps a test page. The Mirror toggle stays there until the ML session replaces it with `dominantHand`.
- Delete `src/App.tsx`.

## Phase 7: Docs

Per `component-conventions` §8: `Sidebar.md`, `AppShell.md`, `AuthProvider.md`, next to their code.

---

## Done when

1. Signed out: `/` shows the navbar + placeholder; `/home` redirects to `/sign-in`.
2. Signed in: `/` redirects to `/home`; the sidebar is expanded; Home and Practice links highlight when active.
3. « collapses to the icon rail; » expands again.
4. Hovering the collapsed rail overlays the full sidebar without moving page content; moving the mouse away collapses it.
5. `/lesson/x` opens with the rail collapsed; navigating to `/home` expands it.
6. `npm run typecheck` and `npm run build` pass.

## Decisions (2026-11-05)

1. **Supabase project:** created directly with Supabase, **not** through the Vercel Marketplace integration, because the Vercel account is already linked to a different Supabase account that must stay linked. The user adds the keys to Vercel env manually. Happens in the step after the foundation.
2. **Auth: stub first.** `AuthProvider` is a fake for now: a dev-only "signed in" toggle (in memory, plus a fake user `{ name, dominantHand: "right" }`) with the same `{ user, status }` shape the Supabase version will expose. So in this foundation pass:
   - `@supabase/supabase-js` is **not** installed;
   - `src/api/supabase.ts` is **not** created;
   - the guards and shells are built against the stub interface.
3. **Signed-in Home is at `/home`.** A signed-in visitor to `/` is redirected there.
4. **The recognition demo stays** as a test page at `/dev/test`, kept for testing and possible expansion. It's dev-only (not linked from the sidebar), and it's reachable whether signed in or not.
