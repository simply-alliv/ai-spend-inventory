import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { AccessPage } from "@/pages/access";
import { CostPage } from "@/pages/cost";
import { DepartmentsPage } from "@/pages/departments";
import { InventoryPage } from "@/pages/inventory";
import { LoginPage } from "@/pages/login";
import { OverviewPage } from "@/pages/overview";
import { RegionsPage } from "@/pages/regions";
import { ReliabilityPage } from "@/pages/reliability";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!role.admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="cost" element={<CostPage />} />
        <Route path="reliability" element={<ReliabilityPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="regions" element={<RegionsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route
          path="access"
          element={
            <RequireAdmin>
              <AccessPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
