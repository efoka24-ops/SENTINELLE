import { type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface RoleGuardProps {
  requiredRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if the user's role is in the requiredRoles list.
 * If the user doesn't have the required role, renders fallback or null.
 */
export function RoleGuard({ requiredRoles, children, fallback }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return fallback ?? null;
  }

  if (requiredRoles.includes(user.role)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}

/**
 * Component that shows a disabled state with a tooltip explaining insufficient permissions.
 */
export function RoleGuardButton({
  requiredRoles,
  children,
  tooltip,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  requiredRoles: string[];
  children: ReactNode;
  tooltip?: string;
}) {
  const { user } = useAuth();

  const hasPermission = user && requiredRoles.includes(user.role);

  if (!hasPermission) {
    return (
      <button
        disabled
        title={tooltip || 'Insufficient permissions for this action'}
        style={{
          opacity: 0.5,
          cursor: 'not-allowed',
          ...((props as any).style || {}),
        }}
        {...(props as any)}
      >
        {children}
      </button>
    );
  }

  return (
    <button {...(props as any)}>
      {children}
    </button>
  );
}
