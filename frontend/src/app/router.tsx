import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { HomePage } from "@/pages/home";
import { CoursesPage } from "@/pages/courses";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";
import { AdminProtectedRoute } from "@/components/admin-protected-route";

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "courses", Component: CoursesPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-dashboard",
        element: (
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        ),
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);