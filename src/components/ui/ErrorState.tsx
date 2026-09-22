import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function ErrorState({
  title = "Unable to load this.",
  description = "Please try again.",
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-danger-400" aria-hidden />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-400">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
