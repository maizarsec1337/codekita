import { request } from "./api";
import type { DashboardData, LessonWorkspace, PathDetail, PathInput, PathSummary } from "@codekita/shared";
const lessonUrl = (module: string, section: string) => `/learn/${encodeURIComponent(module)}/${encodeURIComponent(section)}`;
export const academyApi = {
  paths: () => request<PathSummary[]>("/paths"),
  path: (slug: string) => request<PathDetail>(`/paths/${encodeURIComponent(slug)}`),
  dashboard: () => request<DashboardData>("/learning/dashboard"),
  enroll: (slug: string) => request(`/paths/${encodeURIComponent(slug)}/enroll`, { method: "POST", body: "{}" }),
  lesson: (module: string, section: string) => request<LessonWorkspace>(lessonUrl(module, section)),
  save: (module: string, section: string, notes: string, bookmarked: boolean) => request(lessonUrl(module, section), { method: "PATCH", body: JSON.stringify({ notes, bookmarked }) }),
  complete: (module: string, section: string, answer: number) => request<{ completed: boolean; xpAwarded: number }>(`${lessonUrl(module, section)}/complete`, { method: "POST", body: JSON.stringify({ answer }) }),
  leaderboard: () => request<{ rank: number; name: string; xp: number }[]>("/leaderboard"),
  adminPaths: () => request<AdminPath[]>("/admin/paths"),
  adminStarter: () => request<PathInput[]>("/admin/starter-content"),
  writePath: (input: PathInput, id?: string) => request(id ? `/admin/paths/${id}` : "/admin/paths", { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }),
};
export interface AdminPath extends Omit<PathInput, "modules"> {
  id: string;
  modules: { id: string; title: string; slug: string | null; lessons: { id: string; title: string; slug: string | null; content: string | null; objectives: string[]; assessment: unknown }[] }[];
}