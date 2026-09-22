import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-900/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
                  "rounded-card border border-slate-200 bg-white shadow-xl",
                  sizeClasses[size]
                )}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5 pb-4">
                  <div>
                    <RadixDialog.Title className="text-base font-semibold text-slate-900">
                      {title}
                    </RadixDialog.Title>
                    {description && (
                      <RadixDialog.Description className="mt-1 text-sm text-slate-500">
                        {description}
                      </RadixDialog.Description>
                    )}
                  </div>
                  <RadixDialog.Close
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </RadixDialog.Close>
                </div>
                <div className="overflow-y-auto p-5">{children}</div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
