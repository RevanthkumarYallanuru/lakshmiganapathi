import type { ReactNode } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Plain-language consequence, e.g. "This will affect the customer's
   * financial history." — not a bare "Are you sure?". */
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  /** Optional extra content between the description and the action
   * buttons — e.g. an optional reason field for a cancellation. */
  children?: ReactNode;
}

/** The one component for every destructive / audit-sensitive
 * confirmation: bill cancel, payment reversal, deactivate, etc. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <p className="text-sm text-slate-600">{description}</p>
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
