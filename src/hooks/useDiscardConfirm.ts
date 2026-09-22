import { useState } from "react";

/**
 * Replaces window.confirm() for "unsaved changes" prompts inside a
 * form dialog. A native confirm() fights a Radix Dialog's own focus
 * trap — after it resolves, focus doesn't reliably return, which can
 * leave the dialog's own Cancel/X looking unresponsive. This drives a
 * normal in-app ConfirmDialog instead.
 *
 * Wire `requestClose` as the Dialog's onOpenChange and as the form's
 * Cancel button handler; render a <ConfirmDialog open={confirmOpen}
 * onOpenChange={setConfirmOpen} onConfirm={confirmDiscard} .../> for
 * the "Discard changes?" prompt.
 */
export function useDiscardConfirm(
  isDirty: boolean,
  onClose: (open: boolean) => void
) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function requestClose(next: boolean) {
    if (!next && isDirty) {
      setConfirmOpen(true);
      return;
    }
    onClose(next);
  }

  function confirmDiscard() {
    setConfirmOpen(false);
    onClose(false);
  }

  return { confirmOpen, setConfirmOpen, requestClose, confirmDiscard };
}
