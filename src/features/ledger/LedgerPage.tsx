import { useState } from "react";

import { CustomerLedgerPanel } from "@/features/shared/CustomerLedgerPanel";
import { CustomerPicker } from "@/features/shared/CustomerPicker";
import { Card } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import type { Customer } from "@/types";

function SelectedCustomerHeader({ customer }: { customer: Customer }) {
  const name = useLocalizedName(customer.english_name, customer.telugu_name);
  return (
    <div>
      <p className="text-base font-semibold text-slate-900">{name}</p>
      <p className="text-sm text-slate-500">{customer.customer_code}</p>
    </div>
  );
}

export function LedgerPage() {
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-slate-900">
        {t("ledger.title")}
      </h1>

      <Card>
        <CustomerPicker
          value={customer}
          onChange={setCustomer}
          label={t("payments.customer")}
        />
      </Card>

      {customer ? (
        <>
          <SelectedCustomerHeader customer={customer} />
          <CustomerLedgerPanel customerId={customer.id} />
        </>
      ) : (
        <p className="py-12 text-center text-sm text-slate-400">
          {t("ledger.selectCustomer")}
        </p>
      )}
    </div>
  );
}
