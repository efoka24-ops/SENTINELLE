import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth/AuthContext';
import { PublicSite } from './pages/PublicSite';
import { ReportFlow } from './pages/ReportFlow';
import { Login } from './pages/Login';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardView } from './pages/admin/views/DashboardView';
import { CarteView } from './pages/admin/views/CarteView';
import { CollecteView } from './pages/admin/views/CollecteView';
import { AnalyseView } from './pages/admin/views/AnalyseView';
import { CibView } from './pages/admin/views/CibView';
import { AlertesView } from './pages/admin/views/AlertesView';
import { RapportsView } from './pages/admin/views/RapportsView';
import { AuditView } from './pages/admin/views/AuditView';
import { EndpointsView } from './pages/admin/views/EndpointsView';
import { RenseignementView } from './pages/admin/views/RenseignementView';
import { SignalementsView } from './pages/admin/views/SignalementsView';
import { UsersView } from './pages/admin/views/UsersView';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/signaler" element={<ReportFlow />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="carte" element={<CarteView />} />
        <Route path="collecte" element={<CollecteView />} />
        <Route path="analyse" element={<AnalyseView />} />
        <Route path="cib" element={<CibView />} />
        <Route path="alertes" element={<AlertesView />} />
        <Route path="rapports" element={<RapportsView />} />
        <Route path="audit" element={<AuditView />} />
        <Route path="endpoints" element={<EndpointsView />} />
        <Route path="renseignement" element={<RenseignementView />} />
        <Route path="signalements" element={<SignalementsView />} />
        <Route path="users" element={<UsersView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
