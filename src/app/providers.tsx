import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/components/ui/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Financial/business data should reflect the server promptly;
      // avoid stale-looking screens after a mutation elsewhere.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
