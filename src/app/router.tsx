import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingState } from "@/components/ui/Spinner";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
// AppLayout pulls in MobileNav, which uses framer-motion + Radix Dialog
// — lazy-loading it the same way every page below already is keeps
// those out of the unauthenticated /login screen's critical path.
const AppLayout = lazy(() =>
  import("@/components/layout/AppLayout").then((m) => ({ default: m.AppLayout }))
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
const PayablesPage = lazy(() =>
  import("@/features/payables/PayablesPage").then((m) => ({
    default: m.PayablesPage,
  }))
);
const SuppliersPage = lazy(() =>
  import("@/features/suppliers/SuppliersPage").then((m) => ({
    default: m.SuppliersPage,
  }))
);
const SupplierProfilePage = lazy(() =>
  import("@/features/suppliers/SupplierProfilePage").then((m) => ({
    default: m.SupplierProfilePage,
  }))
);
const ImportsPage = lazy(() =>
  import("@/features/imports/ImportsPage").then((m) => ({
    default: m.ImportsPage,
  }))
);
const InventoryPage = lazy(() =>
  import("@/features/inventory/InventoryPage").then((m) => ({
    default: m.InventoryPage,
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
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <AppLayout />
            </Suspense>
          }
        >
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
          <Route path="/payables" element={<PayablesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierProfilePage />} />
          <Route path="/imports" element={<ImportsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
