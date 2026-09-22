import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { TranslationKey } from "@/i18n";

export interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/items", labelKey: "nav.items", icon: Package },
  { to: "/categories", labelKey: "nav.categories", icon: Tags },
  { to: "/billing", labelKey: "nav.billing", icon: Receipt },
  { to: "/payments", labelKey: "nav.payments", icon: Wallet },
  { to: "/ledger", labelKey: "nav.ledger", icon: BookOpen },
  { to: "/delivery", labelKey: "nav.delivery", icon: Truck },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];
