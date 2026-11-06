import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { NotFoundPage } from "@/pages/not-found";
import { AdminProtectedRoute } from "@/components/admin-protected-route";
import { Navigate } from "react-router-dom";

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("@/pages/home")).HomePage }) },
      { path: "courses", lazy: async () => ({ Component: (await import("@/pages/courses")).CoursesPage }) },
      { path: "paths", lazy: async () => ({ Component: (await import("@/pages/paths")).PathsPage }) },
      { path: "paths/:slug", lazy: async () => ({ Component: (await import("@/pages/path-detail")).PathDetailPage }) },
      { path: "academy", lazy: async () => ({ Component: (await import("@/pages/community")).AcademyPage }) },
      { path: "labs", lazy: async () => ({ Component: (await import("@/pages/labs")).LabsPage }) },
      { path: "challenges", element: <Navigate to="/labs" replace /> },
      { path: "leaderboard", lazy: async () => ({ Component: (await import("@/pages/community")).LeaderboardPage }) },
      { path: "login", lazy: async () => ({ Component: (await import("@/pages/login")).LoginPage }) },
      { path: "register", lazy: async () => ({ Component: (await import("@/pages/register")).RegisterPage }) },
      {
        path: "admin-dashboard",
        lazy: async () => { const { AdminDashboardPage } = await import("@/pages/admin-dashboard"); return { Component: () => <AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute> }; },
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    Component: DashboardLayout,
    children: [
      { path: "/dashboard", lazy: async () => ({ Component: (await import("@/pages/dashboard")).DashboardPage }) },
      { path: "/dashboard/my-learning", lazy: async () => ({ Component: (await import("@/pages/learning-library")).LearningLibraryPage }) },
      { path: "/dashboard/modules", lazy: async () => ({ Component: (await import("@/pages/learning-library")).LearningLibraryPage }) },
      { path: "/learn/:moduleSlug/:sectionSlug", lazy: async () => ({ Component: (await import("@/pages/learn")).LearnPage }) },
      { path: "/achievements", lazy: async () => ({ Component: (await import("@/pages/learning-library")).AchievementsPage }) },
      { path: "/certificates", lazy: async () => ({ Component: (await import("@/pages/certificates")).CertificatesPage }) },
      { path: "/profile", lazy: async () => ({ Component: (await import("@/pages/account")).ProfilePage }) },
      { path: "/settings", lazy: async () => ({ Component: (await import("@/pages/account")).SettingsPage }) },
    ],
  },
]);