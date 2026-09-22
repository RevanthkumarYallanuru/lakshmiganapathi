import { useState } from "react";
import { BarChart3 } from "lucide-react";

import { ItemsReportPanel } from "@/features/reports/ItemsReportPanel";
import { OutstandingReportPanel } from "@/features/reports/OutstandingReportPanel";
import { PaymentsReportPanel } from "@/features/reports/PaymentsReportPanel";
import { SalesReportPanel } from "@/features/reports/SalesReportPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";

type ReportTab = "sales" | "payments" | "outstanding" | "items";

const TABS: { value: ReportTab; labelKey: TranslationKey }[] = [
  { value: "sales", labelKey: "reports.sales" },
  { value: "payments", labelKey: "reports.payments" },
  { value: "outstanding", labelKey: "reports.outstanding" },
  { value: "items", labelKey: "reports.items" },
];

export function ReportsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ReportTab>("sales");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BarChart3 className="h-5 w-5 text-slate-400" aria-hidden />
          {t("reports.title")}
        </h1>
        <div
          className="inline-flex flex-wrap rounded-control border border-slate-200 bg-slate-50 p-0.5 text-sm"
          role="group"
        >
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value)}
              aria-pressed={tab === option.value}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                tab === option.value
                  ? "bg-white text-accent-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {tab === "sales" && <SalesReportPanel />}
      {tab === "payments" && <PaymentsReportPanel />}
      {tab === "outstanding" && <OutstandingReportPanel />}
      {tab === "items" && <ItemsReportPanel />}
    </div>
  );
}
