import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";

/** One "Export" button for every list: runs the given download (which
 * should call `downloadFile` with the list's current filters), shows a
 * spinner while the file is prepared, and reports failures as a toast. */
export function ExportButton({
  onExport,
  disabled,
}: {
  onExport: () => Promise<unknown>;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleClick() {
    setExporting(true);
    try {
      await onExport();
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      loading={exporting}
      disabled={disabled}
    >
      <Download className="h-4 w-4" aria-hidden />
      {t("common.export")}
    </Button>
  );
}
