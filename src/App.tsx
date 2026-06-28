import { Navigate, Route, Routes } from 'react-router-dom';
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
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/signaler" element={<ReportFlow />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPermission="view:dashboard">
              <DashboardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="carte"
          element={
            <ProtectedRoute requiredPermission="view:carte">
              <CarteView />
            </ProtectedRoute>
          }
        />
        <Route
          path="collecte"
          element={
            <ProtectedRoute requiredPermission="view:collecte">
              <CollecteView />
            </ProtectedRoute>
          }
        />
        <Route
          path="analyse"
          element={
            <ProtectedRoute requiredPermission="view:analyse">
              <AnalyseView />
            </ProtectedRoute>
          }
        />
        <Route
          path="cib"
          element={
            <ProtectedRoute requiredPermission="view:analyse">
              <CibView />
            </ProtectedRoute>
          }
        />
        <Route
          path="alertes"
          element={
            <ProtectedRoute requiredPermission="view:alertes">
              <AlertesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="rapports"
          element={
            <ProtectedRoute requiredPermission="view:rapports">
              <RapportsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute requiredPermission="audit:read">
              <AuditView />
            </ProtectedRoute>
          }
        />
        <Route
          path="endpoints"
          element={
            <ProtectedRoute requiredPermission="view:endpoints">
              <EndpointsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="renseignement"
          element={
            <ProtectedRoute requiredPermission="view:renseignement">
              <RenseignementView />
            </ProtectedRoute>
          }
        />
        <Route
          path="signalements"
          element={
            <ProtectedRoute requiredPermission="view:signalements">
              <SignalementsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission="users:manage">
              <UsersView />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
