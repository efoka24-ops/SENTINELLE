import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

/**
 * ProtectedRoute enforces both authentication AND authorization (permission) checks.
 *
 * - If not authenticated → redirect to /admin/login
 * - If authenticated but lacks permission → redirect to /admin/dashboard with error state
 * - Otherwise → render children
 */
export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPerm } = useAuth();

  // Not authenticated: redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated but no permission: redirect to dashboard
  if (requiredPermission && !hasPerm(requiredPermission)) {
    // TODO: In a future update, store error state in a context or URL param
    // so the dashboard can show an error toast
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
