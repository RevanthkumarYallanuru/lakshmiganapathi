import { useEffect } from "react";

import { AppRouter } from "@/app/router";
import { AppProviders } from "@/app/providers";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

/** Surfaces the one-time "your session has expired" toast when the
 * API client clears an expired session — separate from ProtectedRoute,
 * which just handles the redirect. */
function SessionExpiredWatcher() {
  const { isSessionExpired, acknowledgeSessionExpired } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (isSessionExpired) {
      toast({
        variant: "warning",
        title: t("auth.sessionExpired"),
      });
      acknowledgeSessionExpired();
    }
  }, [isSessionExpired, acknowledgeSessionExpired, toast, t]);

  return null;
}

function AppShell() {
  return (
    <>
      <SessionExpiredWatcher />
      <AppRouter />
    </>
  );
}

export function App() {
  return (
    // Outermost safety net — AppLayout has its own ErrorBoundary around
    // just the page content (so a crash there keeps the sidebar/header
    // usable); this one only ever fires for something outside that,
    // e.g. the login page itself or a provider-level crash.
    <ErrorBoundary>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </ErrorBoundary>
  );
}
