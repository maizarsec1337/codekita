"use client";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {user?.email ?? "student"}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Account</h3>
          <p className="mt-1 text-sm">{user?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Roles: {(user?.roles.join(", ") ?? "none").toLowerCase()}
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Enrollments</h3>
          <p className="mt-1 text-sm">No active enrollments</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enroll in a course to track your progress here.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Progress</h3>
          <p className="mt-1 text-sm">0% complete</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start your first lesson to begin tracking progress.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={() => logout}>Sign out</Button>
        <Button variant="outline" onClick={() => navigate("/courses")}>
          Browse courses
        </Button>
      </div>
    </div>
  );
}