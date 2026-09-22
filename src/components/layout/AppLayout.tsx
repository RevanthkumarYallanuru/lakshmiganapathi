import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LoadingState } from "@/components/ui/Spinner";

/** Suspense lives here, not at the router root, so navigating between
 * lazy-loaded pages only replaces the content area — the sidebar and
 * header stay mounted instead of the whole app flashing to a blank
 * loading screen on every route change. */
export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense fallback={<LoadingState label="Loading..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
