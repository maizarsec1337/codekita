"use client";

import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/admin-dashboard" }} />;
  }

  // Check if user has admin role
  const hasAdminRole = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
  if (!hasAdminRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}