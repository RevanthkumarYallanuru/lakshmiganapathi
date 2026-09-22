import * as RadixDialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

import { navItems } from "@/components/layout/navConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content asChild forceMount>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] bg-white shadow-xl md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <RadixDialog.Title className="sr-only">
                  {t("app.name")}
                </RadixDialog.Title>
                <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {t("app.name")}
                  </span>
                  <RadixDialog.Close
                    className="rounded p-1 text-slate-400 hover:bg-slate-100"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </RadixDialog.Close>
                </div>
                <nav className="space-y-0.5 p-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onOpenChange(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium",
                          isActive
                            ? "bg-accent-50 text-accent-700"
                            : "text-slate-600 hover:bg-slate-50"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {t(item.labelKey)}
                    </NavLink>
                  ))}
                </nav>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
