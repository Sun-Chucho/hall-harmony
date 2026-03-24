import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { Permission, canAccessRoute } from '@/lib/authorization';
import { UserRole } from '@/types/auth';

interface RouteGuardProps {
  children: ReactNode;
  path: string;
  requiredPermission?: Permission;
  transactional?: boolean;
  allowedRoles?: UserRole[];
}

export function RouteGuard({
  children,
  path,
  requiredPermission,
  transactional = false,
  allowedRoles,
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { can, policy } = useAuthorization();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/staff" replace />;

  const roleAllowedByRoute = canAccessRoute(user.role, path);
  const roleAllowedByProp = !allowedRoles || allowedRoles.includes(user.role);
  const permissionAllowed = !requiredPermission || can(requiredPermission);

  if (!roleAllowedByRoute || !roleAllowedByProp || !permissionAllowed) {
    const defaultRoute = user.role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  if (transactional && policy.transactionsFrozen && user.role !== 'accountant' && user.role !== 'controller') {
    return (
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <p className="text-xs uppercase tracking-[0.3em]">Transactions Suspended</p>
        <h2 className="mt-2 text-xl font-semibold">Accountant freeze is active</h2>
        <p className="mt-2 text-sm">
          Transactional actions are blocked until the accountant resumes operations.
        </p>
        {policy.freezeReason ? (
          <p className="mt-2 text-sm font-medium">Reason: {policy.freezeReason}</p>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
