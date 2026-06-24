"use client";

import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import {
  Permission,
  Role,
  hasPermission,
} from "../../../config/rbac";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Single role (legacy API, kept for backward compatibility). */
  requiredRole?: string;
  /** Any-of role gate. */
  requiredRoles?: Role[];
  /** Permission gate (preferred) — checked against the user's role. */
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = (() => {
    if (!user) return false;
    if (requiredRole && user.role !== requiredRole) return false;
    if (requiredRoles && !requiredRoles.includes(user.role as Role))
      return false;
    if (requiredPermission && !hasPermission(user.role, requiredPermission))
      return false;
    return true;
  })();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
    } else if (!isAuthorized) {
      router.push("/unauthorized");
    }
  }, [user, isLoading, isAuthorized, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
