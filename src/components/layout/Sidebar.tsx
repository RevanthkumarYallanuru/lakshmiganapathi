import { NavLink } from "react-router-dom";

import { navItems } from "@/components/layout/navConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useLanguage();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-slate-100 px-4">
        <span className="truncate text-sm font-semibold text-slate-900">
          {t("app.name")}
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium",
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
    </aside>
  );
}
