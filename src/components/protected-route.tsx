"use client";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
export function ProtectedRoute({ children, }: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (<div className="flex h-full flex-col items-center justify-center">
        <Skeleton className="h-8 w-32"/>
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    return <>{children}</>;
}
