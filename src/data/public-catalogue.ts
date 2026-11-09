import { publicCatalogueSchema, type PublicCatalogue, type LessonWorkspace, type PathDetail, type PathSummary } from "@codekita/shared";

let pending: Promise<PublicCatalogue> | undefined;

function catalogueHttpError(status: number): Error {
  if (status === 403) return new Error("The public curriculum returned HTTP 403. Check InfinityFree file permissions, hotlink/security rules, and any WAF protection for /catalogue.json.");
  if (status === 404) return new Error("The public curriculum returned HTTP 404. Upload catalogue.json from dist/ to the domain's htdocs root alongside index.html.");
  return new Error(`The public curriculum returned HTTP ${status}. Check the hosting response and try again.`);
}

function catalogue(): Promise<PublicCatalogue> {
  pending ??= fetch("/catalogue.json", { credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(15000) })
    .then(async response => {
      if (!response.ok) throw catalogueHttpError(response.status);

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("application/json") && !contentType.includes("+json")) {
        throw new Error(`The public curriculum endpoint returned ${contentType || "no Content-Type"}, not JSON. Upload catalogue.json to the htdocs root and check that the host is not returning an HTML error or SPA page.`);
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Error("The public curriculum endpoint declared JSON but returned an invalid JSON body. Re-upload the complete dist/ build.");
      }

      const parsed = publicCatalogueSchema.safeParse(data);
      if (!parsed.success) throw new Error("The public curriculum JSON does not match the expected CodeKita catalogue format. Upload catalogue.json from the same dist/ build as the JavaScript assets.");
      return parsed.data;
    })
    .catch(error => {
      pending = undefined;
      if (error instanceof TypeError) throw new Error("Could not reach /catalogue.json. Check the network and same-origin hosting rules; the public catalogue does not require a separate API or cross-origin CORS access.");
      if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("Loading /catalogue.json timed out. Check the network or hosting response and try again.");
      throw error;
    });
  return pending;
}

export async function publicPaths(): Promise<PathSummary[]> { return (await catalogue()).paths; }
export async function publicPath(slug: string): Promise<PathDetail> {
  const path = (await catalogue()).paths.find(item => item.slug === slug);
  if (!path) throw new Error("This learning path is not in the public curriculum.");
  return path;
}
export async function publicLesson(moduleSlug: string, sectionSlug: string): Promise<LessonWorkspace> {
  for (const path of (await catalogue()).paths) {
    const module = path.modules.find(item => item.slug === moduleSlug);
    const lesson = module?.lessons.find(item => item.slug === sectionSlug);
    if (module && lesson) return {
      id: lesson.id, title: lesson.title, content: lesson.content, objectives: lesson.objectives,
      assessment: lesson.assessment, path: { slug: path.slug, title: path.title }, modules: path.modules,
      // Unset preview state, never presented or saved as authenticated learner progress.
      completedLessonIds: [], notes: "", bookmarked: false, completed: false,
    };
  }
  throw new Error("This lesson is not in the public curriculum.");
}
export function backendUnavailable(): never {
  throw new Error("This action requires a configured CodeKita backend and an authenticated session. Nothing was saved.");
}