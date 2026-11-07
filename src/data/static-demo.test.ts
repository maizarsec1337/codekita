import { afterEach, describe, expect, it, vi } from "vitest";
import { coursesResponseSchema } from "@codekita/shared";
import { demoCourses, demoDashboard, demoLesson, demoPath, demoPaths } from "./static-demo";

vi.mock("@/lib/mode", () => ({ isStaticFrontend: true }));
import { academyApi } from "@/lib/academy-api";
import { api, request } from "@/lib/api";

afterEach(() => vi.unstubAllGlobals());
describe("Static frontend data and network boundary", () => {
  it("provides all three academies and valid example courses", () => {
    expect(demoPaths.map((path) => path.academy)).toEqual(["programming", "cybersecurity", "ai"]);
    expect(coursesResponseSchema.parse(demoCourses()).data).toHaveLength(3);
    expect(demoCourses(2, 2).data).toHaveLength(1);
    expect(demoDashboard.certificates).toEqual([]);
  });
  it("resolves course details and lesson data without leaking assessment answers", () => {
    const path = demoPath(demoPaths[0].slug);
    const lesson = demoLesson(path.modules[0].slug, path.modules[0].lessons[0].slug);
    expect(lesson.path.slug).toBe(path.slug);
    expect(lesson.assessment).not.toHaveProperty("correctIndex");
    expect(() => demoPath("missing")).toThrow();
  });
  it("serves demo data and blocks every backend mutation without fetch", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await academyApi.paths()).toHaveLength(3);
    expect((await api.courses()).data).toHaveLength(3);
    expect((await academyApi.dashboard()).xp).toBe(250);
    await expect(academyApi.enroll("example")).rejects.toThrow(/demo/i);
    await expect(academyApi.save("a", "b", "notes", false)).rejects.toThrow(/demo/i);
    await expect(academyApi.complete("a", "b", 0)).rejects.toThrow(/demo/i);
    await expect(request("/auth/me")).rejects.toThrow(/demo/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});