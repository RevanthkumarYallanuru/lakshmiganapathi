import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Only the path+query string is kept (not the whole Location
    // object) — LoginPage reads this directly, so a deep link like
    // /billing/new?customerId=123 survives a cold load (auth
    // hydrating from localStorage after the first render) the same
    // way it already works via in-app navigation.
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return <Outlet />;
}
