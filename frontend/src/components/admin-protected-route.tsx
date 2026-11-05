"use client";

import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  // Check if user has admin role
  const hasAdminRole = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
  if (!hasAdminRole) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return <>{children}</>;
}