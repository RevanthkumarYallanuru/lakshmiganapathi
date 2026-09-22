import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingState } from "@/components/ui/Spinner";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  }))
);
const CustomersPage = lazy(() =>
  import("@/features/customers/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  }))
);
const CustomerProfilePage = lazy(() =>
  import("@/features/customers/CustomerProfilePage").then((m) => ({
    default: m.CustomerProfilePage,
  }))
);
const CategoriesPage = lazy(() =>
  import("@/features/categories/CategoriesPage").then((m) => ({
    default: m.CategoriesPage,
  }))
);
const ItemsPage = lazy(() =>
  import("@/features/items/ItemsPage").then((m) => ({
    default: m.ItemsPage,
  }))
);
const BillingListPage = lazy(() =>
  import("@/features/billing/BillingListPage").then((m) => ({
    default: m.BillingListPage,
  }))
);
const BillNewPage = lazy(() =>
  import("@/features/billing/BillNewPage").then((m) => ({
    default: m.BillNewPage,
  }))
);
const BillDetailPage = lazy(() =>
  import("@/features/billing/BillDetailPage").then((m) => ({
    default: m.BillDetailPage,
  }))
);
const PaymentsListPage = lazy(() =>
  import("@/features/payments/PaymentsListPage").then((m) => ({
    default: m.PaymentsListPage,
  }))
);
const LedgerPage = lazy(() =>
  import("@/features/ledger/LedgerPage").then((m) => ({
    default: m.LedgerPage,
  }))
);
const DeliveryPage = lazy(() =>
  import("@/features/delivery/DeliveryPage").then((m) => ({
    default: m.DeliveryPage,
  }))
);
const ReportsPage = lazy(() =>
  import("@/features/reports/ReportsPage").then((m) => ({
    default: m.ReportsPage,
  }))
);

function PageFallback() {
  return <LoadingState label="Loading..." />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageFallback />}>
            <LoginPage />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerProfilePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/billing" element={<BillingListPage />} />
          <Route path="/billing/new" element={<BillNewPage />} />
          <Route path="/billing/:id" element={<BillDetailPage />} />
          <Route path="/payments" element={<PaymentsListPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
