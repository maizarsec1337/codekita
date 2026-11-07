import { request } from "./api";
import type { DashboardData, LessonWorkspace, PathDetail, PathInput, PathSummary } from "@codekita/shared";
import { isStaticFrontend } from "./mode";
import { demoAdminPaths, demoDashboard, demoLeaderboard, demoLesson, demoPath, demoPaths, demoStarterPaths, demoUnavailable } from "@/data/static-demo";
const lessonUrl = (module: string, section: string) => `/learn/${encodeURIComponent(module)}/${encodeURIComponent(section)}`;
export const academyApi = {
  paths: () => isStaticFrontend ? Promise.resolve(demoPaths) : request<PathSummary[]>("/paths"),
  path: (slug: string) => isStaticFrontend ? Promise.resolve().then(() => demoPath(slug)) : request<PathDetail>(`/paths/${encodeURIComponent(slug)}`),
  dashboard: () => isStaticFrontend ? Promise.resolve(demoDashboard) : request<DashboardData>("/learning/dashboard"),
  enroll: (slug: string) => isStaticFrontend ? Promise.reject(new Error("Demo only: enrollment is unavailable.")) : request(`/paths/${encodeURIComponent(slug)}/enroll`, { method: "POST", body: "{}" }),
  lesson: (module: string, section: string) => isStaticFrontend ? Promise.resolve().then(() => demoLesson(module, section)) : request<LessonWorkspace>(lessonUrl(module, section)),
  save: (module: string, section: string, notes: string, bookmarked: boolean) => isStaticFrontend ? Promise.resolve().then(demoUnavailable) : request(lessonUrl(module, section), { method: "PATCH", body: JSON.stringify({ notes, bookmarked }) }),
  complete: (module: string, section: string, answer: number) => isStaticFrontend ? Promise.resolve().then(demoUnavailable) : request<{ completed: boolean; xpAwarded: number }>(`${lessonUrl(module, section)}/complete`, { method: "POST", body: JSON.stringify({ answer }) }),
  leaderboard: () => isStaticFrontend ? Promise.resolve(demoLeaderboard) : request<{ rank: number; name: string; xp: number }[]>("/leaderboard"),
  adminPaths: () => isStaticFrontend ? Promise.resolve(demoAdminPaths) : request<AdminPath[]>("/admin/paths"),
  adminStarter: () => isStaticFrontend ? Promise.resolve(demoStarterPaths) : request<PathInput[]>("/admin/starter-content"),
  writePath: (input: PathInput, id?: string) => isStaticFrontend ? Promise.resolve().then(demoUnavailable) : request(id ? `/admin/paths/${id}` : "/admin/paths", { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }),
};
export interface AdminPath extends Omit<PathInput, "modules"> {
  id: string;
  modules: { id: string; title: string; slug: string | null; lessons: { id: string; title: string; slug: string | null; content: string | null; objectives: string[]; assessment: unknown }[] }[];
}