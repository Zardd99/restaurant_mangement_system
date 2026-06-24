"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "../presentation/components/ProtectedRoute/ProtectedRoute";

/**
 * Guards every route in the (admin) group. Only admin and manager roles may
 * enter the management dashboard; everyone else is redirected to /unauthorized
 * (or /login if unauthenticated). Backend permissions remain the source of truth.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "manager"]}>
      {children}
    </ProtectedRoute>
  );
}
