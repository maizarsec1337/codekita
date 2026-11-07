import { starterPaths, type DashboardData, type LessonWorkspace, type PathDetail, type PathInput, type PathSummary, type CoursesResponse } from "@codekita/shared";
import type { AdminPath } from "@/lib/academy-api";

// Content and activity are illustrative only; no identity, account or real progress exists.
const outlines: PathDetail[] = starterPaths.map((path) => {
  const modules = path.modules.map((module, order) => ({
    id: module.slug, slug: module.slug, title: module.title, order,
    lessons: module.lessons.map((lesson, index) => ({ id: `${module.slug}/${lesson.slug}`, slug: lesson.slug, title: lesson.title, order: index })),
  }));
  return { id: path.slug, slug: path.slug, title: path.title, description: path.description, academy: path.academy, difficulty: path.difficulty, estimatedMinutes: path.estimatedMinutes, skills: path.skills, prerequisites: path.prerequisites, moduleCount: modules.length, lessonCount: modules.reduce((count, module) => count + module.lessons.length, 0), modules };
});

export const demoPaths: PathSummary[] = outlines;
export const demoProfile = { name: "Demo learner", email: "demo@example.test", roles: ["Preview only"], userId: "demo-preview" };
export const demoDashboard: DashboardData = {
  xp: 250, level: 2, streak: 3, weeklyStreak: 1, completedModules: 0, overallProgress: 0,
  enrollments: [], activity: [{ date: "2026-01-01", count: 1 }, { date: "2026-01-02", count: 2 }, { date: "2026-01-03", count: 1 }],
  achievements: [{ id: "demo-first", title: "First steps", description: "Example achievement shown for the preview.", earned: true }], certificates: [],
};
export const demoLeaderboard = [{ rank: 1, name: "Example engineer", xp: 1200 }, { rank: 2, name: "Demo learner", xp: 250 }];

export function demoCourses(page = 1, limit = 6): CoursesResponse {
  const data = starterPaths.map((path, index) => ({ id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, title: path.title, slug: path.slug, description: path.description, coverImage: null, isPublished: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }));
  return { data: data.slice((page - 1) * limit, page * limit), meta: { page, limit, total: data.length, totalPages: Math.ceil(data.length / limit) } };
}
export function demoPath(slug: string): PathDetail {
  const path = outlines.find((item) => item.slug === slug);
  if (!path) throw new Error("This example learning path does not exist.");
  return path;
}
export function demoLesson(moduleSlug: string, sectionSlug: string): LessonWorkspace {
  for (const path of starterPaths) {
    const module = path.modules.find((item) => item.slug === moduleSlug);
    const lesson = module?.lessons.find((item) => item.slug === sectionSlug);
    if (module && lesson) return { id: `${module.slug}/${lesson.slug}`, title: lesson.title, content: lesson.content, objectives: lesson.objectives, assessment: { question: lesson.assessment.question, options: lesson.assessment.options }, path: { slug: path.slug, title: path.title }, modules: demoPath(path.slug).modules, completedLessonIds: [], notes: "", bookmarked: false, completed: false };
  }
  throw new Error("This example lesson does not exist.");
}
export const demoAdminPaths: AdminPath[] = starterPaths.map((path) => ({ ...path, id: path.slug, modules: path.modules.map((module) => ({ ...module, id: module.slug, lessons: module.lessons.map((lesson) => ({ ...lesson, id: `${module.slug}/${lesson.slug}` })) })) }));
export const demoStarterPaths: PathInput[] = starterPaths;
export function demoUnavailable(): never { throw new Error("Static demo only: this action is unavailable and nothing was saved."); }