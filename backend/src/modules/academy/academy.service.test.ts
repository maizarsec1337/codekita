import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademyService } from "./academy.service";
import type { PrismaService } from "../../database/prisma.service";
import { Prisma } from "@prisma/client";
describe("Assessment completion transaction", () => {
  let service: AcademyService;
  const db = {
    courseModule: { findFirst: vi.fn() }, enrollment: { findUnique: vi.fn() },
    learningProgress: { upsert: vi.fn() }, xpEvent: { findUnique: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
    certificate: { upsert: vi.fn() },
  };
  const transaction = vi.fn();
  const lesson = { id: "lesson-1", slug: "start", title: "First", content: "Original lesson", objectives: [], assessment: { question: "Which is correct?", options: ["yes", "no"], correctIndex: 0 } };
  const course = { id: "course-1", slug: "test", title: "Path", isPublished: true, prerequisites: [], modules: [{ id: "module-1", slug: "module", title: "Module", order: 0, lessons: [lesson] }] };
  beforeEach(() => {
    vi.resetAllMocks();
    db.courseModule.findFirst.mockResolvedValue({ ...course.modules[0], course });
    db.enrollment.findUnique.mockResolvedValue({ id: "enrollment-1", progress: [] });
    db.xpEvent.findUnique.mockResolvedValue(null); db.xpEvent.createMany.mockResolvedValue({ count: 1 });
    db.xpEvent.findMany.mockResolvedValue([{ eventKey: "lesson:lesson-1" }]);
    transaction.mockImplementation((callback) => callback(db));
    service = new AcademyService({ ...db, $transaction: transaction } as unknown as PrismaService);
  });
  it("rejects the wrong answer without writing progress, XP, or a certificate", async () => {
    await expect(service.complete("user-1", "module", "start", 1)).rejects.toThrow("Not quite");
    expect(db.learningProgress.upsert).not.toHaveBeenCalled(); expect(db.xpEvent.createMany).not.toHaveBeenCalled(); expect(db.certificate.upsert).not.toHaveBeenCalled();
  });
  it("awards XP only through a unique event in a serializable transaction", async () => {
    const result = await service.complete("user-1", "module", "start", 0);
    expect(result.xpAwarded).toBe(50);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    expect(db.xpEvent.createMany).toHaveBeenCalledWith({ data: [{ userId: "user-1", eventKey: "lesson:lesson-1", amount: 50 }], skipDuplicates: true });
    expect(db.certificate.upsert).toHaveBeenCalledTimes(1);
  });
  it("does not award duplicate XP for a completed assessed lesson", async () => {
    db.enrollment.findUnique.mockResolvedValue({ id: "enrollment-1", progress: [{ lessonId: "lesson-1", completed: true }] }); db.xpEvent.findUnique.mockResolvedValue({ amount: 50 });
    expect((await service.complete("user-1", "module", "start", 0)).xpAwarded).toBe(0); expect(db.xpEvent.createMany).not.toHaveBeenCalled();
  });
  it("does not issue a certificate when any lesson lacks validated events", async () => {
    db.xpEvent.findMany.mockResolvedValue([]); await service.complete("user-1", "module", "start", 0); expect(db.certificate.upsert).not.toHaveBeenCalled();
  });
  it("requires enrollment and does not trust a client-provided user identity", async () => {
    db.enrollment.findUnique.mockResolvedValue(null); await expect(service.complete("user-1", "module", "start", 0)).rejects.toThrow("Enroll"); expect(db.xpEvent.createMany).not.toHaveBeenCalled();
  });
  it("does not leak the correct answer in a workspace response", async () => {
    const workspace = await service.workspace("user-1", "module", "start"); expect(workspace.assessment).toEqual({ question: lesson.assessment.question, options: lesson.assessment.options }); expect(JSON.stringify(workspace)).not.toContain("correctIndex");
  });
  it("retries a serialization conflict", async () => {
    transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "6" }));
    expect((await service.complete("user-1", "module", "start", 0)).xpAwarded).toBe(50); expect(transaction).toHaveBeenCalledTimes(2);
  });
});