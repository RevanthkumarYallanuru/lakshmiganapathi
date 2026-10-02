import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

/** A failed dynamic `import()` — either a genuine network blip, or (the
 * common real-world case) the visitor had the app open from before the
 * last deploy and is now asking for a page chunk whose hashed filename
 * no longer exists on the server. Either way, the fix is the same: a
 * full reload fetches the current index.html and current chunk hashes. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|loading chunk|chunkloaderror/i.test(
    message
  );
}

interface Props {
  children: ReactNode;
  /** Shown instead of the default full-page layout when this boundary
   * sits inside page chrome that should stay on screen (sidebar/header)
   * — see AppLayout, which wraps only its <Outlet />, not itself. */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Catches render-time crashes (e.g. a page assuming an API field is
 * always present when it can legitimately be absent) and stale-chunk
 * load failures, so one broken page shows a clear, recoverable error
 * instead of leaving the whole app blank. React error boundaries can
 * only be class components — this is the one place that's true in the
 * app, everything else stays function components/hooks as normal.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Diagnostic only — never sent anywhere, never shown to the user
    // (the fallback UI below never includes error.message/stack), so
    // this can't leak backend/database details.
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const title = this.state.isChunkError
      ? "A newer version of this app is available"
      : "Something went wrong";
    const description = this.state.isChunkError
      ? "Please reload to get the latest version."
      : "Reloading the page usually fixes this — nothing you've entered elsewhere was lost.";

    return (
      <div
        className={
          this.props.compact
            ? "flex flex-col items-center justify-center gap-3 py-16 text-center"
            : "flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center"
        }
      >
        <AlertTriangle className="h-9 w-9 text-danger-400" aria-hidden />
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
        <Button onClick={this.handleReload} className="mt-1">
          Reload
        </Button>
      </div>
    );
  }
}
