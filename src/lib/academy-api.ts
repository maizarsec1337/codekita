import { request } from "./api";
import { pathDetailSchema, pathSummarySchema, type DashboardData, type LessonWorkspace, type PathDetail, type PathInput, type PathSummary } from "@codekita/shared";
import { isStaticFrontend } from "./mode";
import { publicLesson, publicPath, publicPaths, backendUnavailable } from "@/data/public-catalogue";
const lessonUrl = (module: string, section: string) => `/learn/${encodeURIComponent(module)}/${encodeURIComponent(section)}`;
export const academyApi = {
  paths: () => isStaticFrontend ? publicPaths() : request<unknown>("/paths").then((data) => {
    if (!Array.isArray(data)) throw new Error("The CodeKita API returned an invalid learning catalogue.");
    return data.map((path) => pathSummarySchema.parse(path)) as PathSummary[];
  }),
  path: (slug: string) => isStaticFrontend ? publicPath(slug) : request<unknown>(`/paths/${encodeURIComponent(slug)}`).then((data) => pathDetailSchema.parse(data) as PathDetail),
  dashboard: () => isStaticFrontend ? Promise.reject(new Error("Learner progress requires an authenticated CodeKita backend.")) : request<DashboardData>("/learning/dashboard"),
  enroll: (slug: string) => isStaticFrontend ? Promise.resolve().then(backendUnavailable) : request(`/paths/${encodeURIComponent(slug)}/enroll`, { method: "POST", body: "{}" }),
  lesson: (module: string, section: string) => isStaticFrontend ? publicLesson(module, section) : request<LessonWorkspace>(lessonUrl(module, section)),
  save: (module: string, section: string, notes: string, bookmarked: boolean) => isStaticFrontend ? Promise.resolve().then(backendUnavailable) : request(lessonUrl(module, section), { method: "PATCH", body: JSON.stringify({ notes, bookmarked }) }),
  complete: (module: string, section: string, answer: number) => isStaticFrontend ? Promise.resolve().then(backendUnavailable) : request<{ completed: boolean; xpAwarded: number }>(`${lessonUrl(module, section)}/complete`, { method: "POST", body: JSON.stringify({ answer }) }),
  leaderboard: () => isStaticFrontend ? Promise.reject(new Error("Live learner rankings require the CodeKita backend.")) : request<{ rank: number; name: string; xp: number }[]>("/leaderboard"),
  adminPaths: () => isStaticFrontend ? Promise.reject(new Error("Curriculum administration requires an authorized CodeKita backend session.")) : request<AdminPath[]>("/admin/paths"),
  adminStarter: () => isStaticFrontend ? Promise.reject(new Error("Curriculum administration requires an authorized CodeKita backend session.")) : request<PathInput[]>("/admin/starter-content"),
  writePath: (input: PathInput, id?: string) => isStaticFrontend ? Promise.resolve().then(backendUnavailable) : request(id ? `/admin/paths/${id}` : "/admin/paths", { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }),
};
export interface AdminPath extends Omit<PathInput, "modules"> {
  id: string;
  modules: { id: string; title: string; slug: string | null; lessons: { id: string; title: string; slug: string | null; content: string | null; objectives: string[]; assessment: unknown }[] }[];
}