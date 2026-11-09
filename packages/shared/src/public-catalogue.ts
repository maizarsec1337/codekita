import { z } from "zod";
import { pathDetailSchema } from "./academy";

// The public snapshot deliberately excludes assessment answers and all learner data.
const publicLessonSchema = pathDetailSchema.shape.modules.element.shape.lessons.element.extend({
  content: z.string(),
  objectives: z.array(z.string()),
  assessment: z.object({ question: z.string(), options: z.array(z.string()).min(2) }),
});
export const publicCatalogueSchema = z.object({
  version: z.literal(1),
  source: z.literal("repository-starter-curriculum"),
  paths: z.array(pathDetailSchema.extend({
    modules: z.array(pathDetailSchema.shape.modules.element.extend({ lessons: z.array(publicLessonSchema) })),
  })),
});
export type PublicCatalogue = z.infer<typeof publicCatalogueSchema>;