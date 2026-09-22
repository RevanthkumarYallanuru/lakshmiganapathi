import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";

import { MobileNav } from "@/components/layout/MobileNav";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="text-sm font-semibold text-slate-900 md:hidden">
            {t("app.name")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          <RadixDropdown.Root>
            <RadixDropdown.Trigger
              className={cn(
                "flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                <User className="h-4 w-4" aria-hidden />
              </span>
              <span className="hidden max-w-[8rem] truncate sm:inline">
                {user?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            </RadixDropdown.Trigger>
            <RadixDropdown.Portal>
              <RadixDropdown.Content
                align="end"
                sideOffset={6}
                className="z-50 w-44 rounded-card border border-slate-200 bg-white p-1 shadow-lg"
              >
                <RadixDropdown.Item
                  onSelect={handleLogout}
                  className="flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {t("auth.logout")}
                </RadixDropdown.Item>
              </RadixDropdown.Content>
            </RadixDropdown.Portal>
          </RadixDropdown.Root>
        </div>
      </header>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  );
}
