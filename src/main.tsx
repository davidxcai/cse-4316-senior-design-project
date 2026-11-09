import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { IconError404 } from "@tabler/icons-react";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { RecognizerProvider } from "./recognition";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  // auth is supplied by <RouterProvider context> below.
  context: { auth: undefined!, queryClient },
  defaultPreload: "intent",
  defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    focus?: boolean;
  }
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <IconError404 size={48} aria-hidden />
      <span className="text-lg">Not found</span>
    </div>
  );
}

function AppRouter() {
  const auth = useAuth();

  // Re-run beforeLoad guards when auth changes (sign-in → /home, sign-out → /sign-in).
  useEffect(() => {
    router.invalidate();
  }, [auth.status]);

  if (auth.status === "loading") return null;
  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RecognizerProvider>
          <AppRouter />
        </RecognizerProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
