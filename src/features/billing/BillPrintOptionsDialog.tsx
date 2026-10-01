import { Dialog, Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Asks, once per Print/Download click, whether the previous balance and
 * running total balance should be shown on the printed bill/PDF. Purely
 * a presentation choice for this one print/download — it is never
 * saved anywhere, never touches the bill's stored data, and the
 * dashboard/bill-detail view always keeps showing the full balance
 * information regardless of what's picked here.
 */
export function BillPrintOptionsDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (includePreviousBalance: boolean) => void;
}) {
  const { t } = useLanguage();

  function choose(includePreviousBalance: boolean) {
    onOpenChange(false);
    onSelect(includePreviousBalance);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("billing.printOptionsTitle")}
      description={t("billing.printOptionsDescription")}
      size="sm"
    >
      <div className="flex flex-col gap-2">
        <Button variant="primary" onClick={() => choose(true)}>
          {t("billing.includePreviousBalanceOption")}
        </Button>
        <Button variant="outline" onClick={() => choose(false)}>
          {t("billing.currentBillOnlyOption")}
        </Button>
      </div>
    </Dialog>
  );
}
