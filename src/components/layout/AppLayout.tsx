import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { LoadingState } from "@/components/ui/Spinner";

/** Suspense lives here, not at the router root, so navigating between
 * lazy-loaded pages only replaces the content area — the sidebar and
 * header stay mounted instead of the whole app flashing to a blank
 * loading screen on every route change. ErrorBoundary wraps the same
 * <Outlet />, for the same reason: a crash in one page's content
 * shows a clear, recoverable message in that content area, with the
 * sidebar/header (and the ability to navigate elsewhere) still right
 * there — not the entire app going blank. */
export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Keyed on the path so navigating to a *different* page
              after a crash remounts the boundary (and whatever is
              now behind it) fresh, instead of staying stuck showing
              the previous page's error. */}
          <ErrorBoundary key={location.pathname} compact>
            <Suspense fallback={<LoadingState label="Loading..." />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
