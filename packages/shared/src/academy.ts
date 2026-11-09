import { z } from "zod";

export const academySchema = z.enum(["programming", "cybersecurity", "ai"]);
export type Academy = z.infer<typeof academySchema>;
export const difficultySchema = z.enum(["Beginner", "Intermediate", "Advanced"]);
export const assessmentSchema = z.object({
  question: z.string().min(5).max(2000),
  options: z.array(z.string().min(1).max(1000)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
}).refine((value) => value.correctIndex < value.options.length, "Answer must reference an option");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const lessonInputSchema = z.object({
  id: z.string().uuid().optional(), slug, title: z.string().min(3).max(200),
  content: z.string().min(20).max(100000), objectives: z.array(z.string().max(500)).max(12),
  assessment: assessmentSchema,
});
export const pathInputSchema = z.object({
  title: z.string().min(3).max(200), slug, description: z.string().min(10).max(3000),
  academy: academySchema, difficulty: difficultySchema,
  estimatedMinutes: z.number().int().min(10).max(30000),
  skills: z.array(z.string().min(1).max(100)).max(30),
  prerequisites: z.array(slug).max(20), isPublished: z.boolean(),
  modules: z.array(z.object({
    id: z.string().uuid().optional(), slug, title: z.string().min(3).max(200),
    lessons: z.array(lessonInputSchema).min(1).max(100),
  })).min(1).max(100),
}).superRefine((value, context) => {
  const slugs = value.modules.map((module) => module.slug);
  if (new Set(slugs).size !== slugs.length) context.addIssue({ code: "custom", message: "Module slugs must be unique" });
  for (const module of value.modules) {
    const sections = module.lessons.map((lesson) => lesson.slug);
    if (new Set(sections).size !== sections.length) context.addIssue({ code: "custom", message: "Section slugs must be unique within each module" });
  }
  if (value.prerequisites.includes(value.slug)) context.addIssue({ code: "custom", message: "A path cannot require itself" });
});
export type PathInput = z.infer<typeof pathInputSchema>;
export interface PathSummary {
  id: string; slug: string; title: string; description: string | null;
  academy: Academy; difficulty: string; estimatedMinutes: number;
  skills: string[]; prerequisites: string[]; moduleCount: number; lessonCount: number;
}
export const pathSummarySchema = z.object({
  id: z.string().min(1), slug, title: z.string().min(1), description: z.string().nullable(),
  academy: academySchema, difficulty: z.string().min(1), estimatedMinutes: z.number().int().nonnegative(),
  skills: z.array(z.string()), prerequisites: z.array(z.string()), moduleCount: z.number().int().nonnegative(), lessonCount: z.number().int().nonnegative(),
});
export interface SectionSummary { id: string; slug: string; title: string; order: number }
export interface ModuleSummary { id: string; slug: string; title: string; order: number; lessons: SectionSummary[] }
export interface PathDetail extends PathSummary { modules: ModuleSummary[] }
export const pathDetailSchema = pathSummarySchema.extend({ modules: z.array(z.object({
  id: z.string().min(1), slug, title: z.string().min(1), order: z.number().int().nonnegative(),
  lessons: z.array(z.object({ id: z.string().min(1), slug, title: z.string().min(1), order: z.number().int().nonnegative() })),
})) });
export interface EnrollmentSummary {
  id: string; path: PathSummary; completedLessonIds: string[]; progress: number;
  next: { moduleSlug: string; sectionSlug: string } | null;
}
export interface DashboardData {
  xp: number; level: number; streak: number; weeklyStreak: number; completedModules: number;
  overallProgress: number; enrollments: EnrollmentSummary[];
  activity: { date: string; count: number }[];
  achievements: { id: string; title: string; description: string; earned: boolean }[];
  certificates: { id: string; title: string; issuedAt: string }[];
}
export interface LessonWorkspace {
  id: string; title: string; content: string | null; objectives: string[];
  assessment: { question: string; options: string[] } | null;
  path: { slug: string; title: string }; modules: ModuleSummary[];
  completedLessonIds: string[]; notes: string; bookmarked: boolean; completed: boolean;
}
export const labDefinitions = [
  { id: "array-transform", academy: "programming" as const, title: "Transform a dataset", language: "javascript", duration: "25 min", description: "Return the square of each number without mutating the input array.", starter: "function squareAll(numbers) {\n  // Return a new array of squared numbers.\n}\n", sample: "Input: [1, 2, 3]\nExpected: [1, 4, 9]", objectives: ["Use a pure function", "Preserve the original input", "Handle an empty array"], hint: "Array.map creates a new array from a transformation." },
  { id: "defensive-log-review", academy: "cybersecurity" as const, title: "Investigate an access log", language: "text", duration: "35 min", description: "Review the supplied fictional access log. Identify suspicious authentication patterns and propose defensive controls. No external targets are involved.", starter: "09:10:00 POST /login 401 user=training\n09:10:01 POST /login 401 user=training\n09:10:02 POST /login 401 user=training\n09:10:03 POST /login 429 user=training\n\nObservations:\n\nRecommended controls:\n", sample: "Training artifact only. No live network or terminal is connected.", objectives: ["Identify repeated failed authentication", "Explain rate limiting", "Recommend a defensive response"], hint: "Compare timestamps and HTTP status codes. A 429 response indicates rate limiting." },
  { id: "classification-metrics", academy: "ai" as const, title: "Evaluate a classifier", language: "python", duration: "30 min", description: "Calculate precision and recall from a confusion matrix. Explain why accuracy alone can be misleading for imbalanced datasets.", starter: "true_positive = 32\nfalse_positive = 8\nfalse_negative = 16\n\n# Calculate precision and recall.\n", sample: "Precision: 0.80\nRecall: 0.6667 (approximately)", objectives: ["Compute precision", "Compute recall", "Explain the trade-off"], hint: "Precision = TP / (TP + FP). Recall = TP / (TP + FN)." },
];