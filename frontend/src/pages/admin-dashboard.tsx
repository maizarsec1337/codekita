"use client";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome, {user?.email}. You have administrator privileges.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Users</h3>
          <p className="mt-1 text-sm">Manage user accounts</p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Courses</h3>
          <p className="mt-1 text-sm">Manage course catalog</p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Settings</h3>
          <p className="mt-1 text-sm">Platform settings</p>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={() => logout}>Sign out</Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          User Dashboard
        </Button>
      </div>
    </div>
  );
}