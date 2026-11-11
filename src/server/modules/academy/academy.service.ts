import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { Prisma, type Course } from "@prisma/client";
import { assessmentSchema, type Academy, type DashboardData, type PathInput, type PathSummary, type SessionPayload } from "@codekita/shared";
import { PrismaService } from "../../database/prisma.service";
import { assertSequence, streaks } from "./progress";

const structure = { modules: { orderBy: [{ order: "asc" as const }, { id: "asc" as const }], include: { lessons: { orderBy: [{ order: "asc" as const }, { id: "asc" as const }] } } } };
type CourseTree = Prisma.CourseGetPayload<{ include: typeof structure }>;
const sections = (course: CourseTree) => course.modules.flatMap((module) => module.lessons);
const outline = (course: CourseTree) => course.modules.map((module) => ({ id: module.id, slug: module.slug ?? module.id, title: module.title, order: module.order, lessons: module.lessons.map((lesson) => ({ id: lesson.id, slug: lesson.slug ?? lesson.id, title: lesson.title, order: lesson.order })) }));
function summary(course: CourseTree): PathSummary {
  return { id: course.id, title: course.title, slug: course.slug, description: course.description, categoryId: course.categoryId, academy: course.academy as Academy, difficulty: course.difficulty, estimatedMinutes: course.estimatedMinutes, skills: course.skills, prerequisites: course.prerequisites, moduleCount: course.modules.length, lessonCount: sections(course).length };
}

@Injectable()
export class AcademyService {
  constructor(private readonly prisma: PrismaService) {}

  async paths() {
    try {
      return (await this.prisma.course.findMany({ where: { isPublished: true }, include: structure, orderBy: { createdAt: "asc" } })).map(summary);
    } catch { throw new ServiceUnavailableException("The learning catalogue is unavailable. Please try again shortly."); }
  }

  private async path(slug: string, db: Prisma.TransactionClient = this.prisma) {
    const course = await db.course.findUnique({ where: { slug }, include: structure });
    if (!course?.isPublished) throw new NotFoundException("Learning path not found");
    return course;
  }

  async detail(slug: string) {
    const course = await this.path(slug);
    return { ...summary(course), modules: outline(course) };
  }

  private async prerequisites(userId: string, course: Course, db: Prisma.TransactionClient) {
    for (const slug of course.prerequisites) {
      const required = await db.course.findUnique({ where: { slug }, include: structure });
      if (!required?.isPublished || !sections(required).length) throw new ForbiddenException("A prerequisite path is not available yet.");
      const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: required.id } }, include: { progress: { where: { completed: true } } } });
      if (!enrollment || sections(required).some((lesson) => !enrollment.progress.some((progress) => progress.lessonId === lesson.id))) {
        throw new ForbiddenException(`Complete prerequisite: ${required.title}`);
      }
    }
  }

  async enroll(userId: string, slug: string) {
    return this.prisma.$transaction(async (db) => {
      const course = await this.path(slug, db);
      if (!sections(course).length) throw new ConflictException("This path has no published lessons yet.");
      await this.prerequisites(userId, course, db);
      return db.enrollment.upsert({ where: { userId_courseId: { userId, courseId: course.id } }, create: { userId, courseId: course.id }, update: {} });
    });
  }

  private async access(userId: string, moduleSlug: string, sectionSlug: string, db: Prisma.TransactionClient) {
    const module = await db.courseModule.findFirst({ where: { OR: [{ slug: moduleSlug }, ...(isUuid(moduleSlug) ? [{ id: moduleSlug }] : [])] }, include: { course: { include: structure }, lessons: true } });
    if (!module?.course.isPublished) throw new NotFoundException("Module not found");
    const lesson = module.lessons.find((item) => (item.slug ?? item.id) === sectionSlug);
    if (!lesson) throw new NotFoundException("Section not found");
    const course = module.course;
    const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: course.id } }, include: { progress: true } });
    if (!enrollment) throw new ForbiddenException("Enroll in this path before opening a lesson.");
    await this.prerequisites(userId, course, db);
    const completed = enrollment.progress.filter((item) => item.completed).map((item) => item.lessonId);
    assertSequence(sections(course).map((item) => item.id), completed, lesson.id);
    return { course, lesson, enrollment, completed };
  }

  async workspace(userId: string, moduleSlug: string, sectionSlug: string) {
    const { course, lesson, enrollment, completed } = await this.access(userId, moduleSlug, sectionSlug, this.prisma);
    const progress = enrollment.progress.find((item) => item.lessonId === lesson.id);
    const assessment = assessmentSchema.safeParse(lesson.assessment);
    const validated = await this.prisma.xpEvent.findUnique({ where: { userId_eventKey: { userId, eventKey: `lesson:${lesson.id}` } } });
    return { id: lesson.id, title: lesson.title, content: lesson.content, objectives: lesson.objectives, assessment: assessment.success ? { question: assessment.data.question, options: assessment.data.options } : null, path: { slug: course.slug, title: course.title }, modules: outline(course), completedLessonIds: completed, notes: progress?.notes ?? "", bookmarked: progress?.bookmarked ?? false, completed: !!progress?.completed && !!validated };
  }

  async save(userId: string, moduleSlug: string, sectionSlug: string, input: { notes: string; bookmarked: boolean }) {
    const { lesson, enrollment } = await this.access(userId, moduleSlug, sectionSlug, this.prisma);
    return this.prisma.learningProgress.upsert({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } }, create: { enrollmentId: enrollment.id, lessonId: lesson.id, ...input }, update: input });
  }

  async complete(userId: string, moduleSlug: string, sectionSlug: string, answer: number) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.prisma.$transaction(async (db) => {
          const { course, lesson, enrollment } = await this.access(userId, moduleSlug, sectionSlug, db);
          const previous = enrollment.progress.find((item) => item.lessonId === lesson.id);
          const existingEvent = await db.xpEvent.findUnique({ where: { userId_eventKey: { userId, eventKey: `lesson:${lesson.id}` } } });
          if (previous?.completed && existingEvent) return { completed: true, xpAwarded: 0, alreadyCompleted: true };
          const assessment = assessmentSchema.safeParse(lesson.assessment);
          if (!assessment.success) throw new ConflictException("This lesson needs a configured assessment before completion can be validated.");
          if (answer >= assessment.data.options.length) throw new BadRequestException("Invalid answer option");
          const quiz = await db.quiz.upsert({ where: { lessonId: lesson.id }, create: { lessonId: lesson.id, ...assessment.data }, update: {} });
          const passed = answer === quiz.correctIndex;
          await db.quizResult.create({ data: { quizId: quiz.id, userId, answer, passed } });
          if (!passed) return { completed: false, xpAwarded: 0 };
          await db.learningProgress.upsert({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } }, create: { enrollmentId: enrollment.id, lessonId: lesson.id, completed: true, completedAt: new Date() }, update: { completed: true, completedAt: new Date() } });
          const event = await db.xpEvent.createMany({ data: [{ userId, eventKey: `lesson:${lesson.id}`, amount: 50 }], skipDuplicates: true });
          // Legacy "mark complete" records are preserved, but certificates require assessed events for every lesson.
          const validated = await db.xpEvent.findMany({ where: { userId, eventKey: { in: sections(course).map((item) => `lesson:${item.id}`) } } });
          if (sections(course).length && validated.length === sections(course).length) {
            await db.certificate.upsert({ where: { enrollmentId: enrollment.id }, create: { enrollmentId: enrollment.id, title: course.title }, update: {} });
          }
          return { completed: true, xpAwarded: event.count ? 50 : 0, alreadyCompleted: false };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
        // Throw only after committing the unsuccessful attempt; never invent a result.
        if (!result.completed) throw new BadRequestException("Not quite. Review the lesson and try the knowledge check again.");
        return result;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") continue;
        throw error;
      }
    }
    throw new ConflictException("Progress was updated concurrently. Please retry.");
  }

  async dashboard(userId: string): Promise<DashboardData> {
    const [enrollments, events, certificates] = await Promise.all([
      this.prisma.enrollment.findMany({ where: { userId, course: { isPublished: true } }, include: { course: { include: structure }, progress: true }, orderBy: { enrolledAt: "desc" } }),
      this.prisma.xpEvent.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      this.prisma.certificate.findMany({ where: { enrollment: { userId } }, orderBy: { issuedAt: "desc" } }),
    ]);
    const xp = events.reduce((sum, event) => sum + event.amount, 0);
    const streak = streaks(events.map((event) => event.createdAt));
    let completedModules = 0, done = 0, total = 0;
    const learning = enrollments.map((enrollment) => {
      const ids = new Set(sections(enrollment.course).map((item) => item.id));
      const completedLessonIds = enrollment.progress.filter((item) => item.completed && ids.has(item.lessonId)).map((item) => item.lessonId);
      total += ids.size; done += completedLessonIds.length;
      for (const module of enrollment.course.modules) if (module.lessons.length && module.lessons.every((lesson) => completedLessonIds.includes(lesson.id))) completedModules++;
      const nextModule = enrollment.course.modules.find((module) => module.lessons.some((lesson) => !completedLessonIds.includes(lesson.id)));
      const nextLesson = nextModule?.lessons.find((lesson) => !completedLessonIds.includes(lesson.id));
      return { id: enrollment.id, path: summary(enrollment.course), completedLessonIds, progress: ids.size ? Math.round(completedLessonIds.length / ids.size * 100) : 0, next: nextModule && nextLesson ? { moduleSlug: nextModule.slug ?? nextModule.id, sectionSlug: nextLesson.slug ?? nextLesson.id } : null };
    });
    const activity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10);
      return { date, count: events.filter((event) => event.createdAt.toISOString().startsWith(date)).length };
    });
    return { xp, level: Math.floor(xp / 500) + 1, streak: streak.daily, weeklyStreak: streak.weekly, completedModules, overallProgress: total ? Math.round(done / total * 100) : 0, enrollments: learning, activity, achievements: [
      { id: "first-step", title: "First commit", description: "Pass your first lesson assessment", earned: events.length > 0 },
      { id: "consistent", title: "In the flow", description: "Learn on three consecutive UTC days", earned: streak.daily >= 3 },
      { id: "pathfinder", title: "Pathfinder", description: "Earn your first verified path certificate", earned: certificates.length > 0 },
    ], certificates: certificates.map((item) => ({ id: item.id, title: item.title, issuedAt: item.issuedAt.toISOString() })) };
  }

  async leaderboard() {
    const scores = await this.prisma.xpEvent.groupBy({ by: ["userId"], _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 50 });
    // Privacy: never publish account emails or names without explicit opt-in.
    return scores.map((score, index) => ({ rank: index + 1, name: `Engineer ${index + 1}`, xp: score._sum.amount ?? 0 }));
  }

  async adminList(actor: SessionPayload) {
    return this.prisma.course.findMany({ where: this.isAdmin(actor) ? {} : { instructorId: actor.userId }, include: structure, orderBy: { updatedAt: "desc" } });
  }

  private isAdmin(actor: SessionPayload) { return actor.roles.some(role => role === "ADMIN" || role === "SUPER_ADMIN"); }

  async archive(id: string, actor: SessionPayload) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException("Path not found");
    if (!this.isAdmin(actor) && course.instructorId !== actor.userId) throw new ForbiddenException("This path belongs to another instructor");
    return this.prisma.course.update({ where: { id }, data: { isPublished: false } });
  }

  async writePath(input: PathInput, actor: SessionPayload, id?: string) {
    return this.prisma.$transaction(async (db) => {
      if (id) {
        const existing = await db.course.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Path not found");
        if (!this.isAdmin(actor) && existing.instructorId !== actor.userId) throw new ForbiddenException("This path belongs to another instructor");
      }
      if (input.categoryId && !await db.category.findFirst({ where: { id: input.categoryId, isActive: true } })) throw new BadRequestException("Choose an active category");
      for (const prerequisite of input.prerequisites) {
        const required = await db.course.findUnique({ where: { slug: prerequisite } });
        if (!required) throw new BadRequestException(`Unknown prerequisite: ${prerequisite}`);
        const visited = new Set<string>();
        const visit = async (slug: string): Promise<void> => {
          if (slug === input.slug) throw new BadRequestException("Prerequisites cannot contain a cycle");
          if (visited.has(slug)) return;
          visited.add(slug);
          const path = await db.course.findUnique({ where: { slug } });
          for (const parent of path?.prerequisites ?? []) await visit(parent);
        };
        await visit(prerequisite);
      }
      const { modules, ...data } = input;
      if (id) {
        const old = await db.course.findUniqueOrThrow({ where: { id }, include: structure });
        if (old.slug !== input.slug) throw new BadRequestException("Published identifiers are stable. Create a new path to change the path slug.");
        for (const module of old.modules) {
          const incoming = modules.find((item) => item.id === module.id);
          if (!incoming || incoming.slug !== (module.slug ?? module.id)) throw new BadRequestException("Existing modules must retain their IDs and slugs. Archive the path instead of deleting curriculum.");
          for (const lesson of module.lessons) if (!incoming.lessons.some((item) => item.id === lesson.id && item.slug === (lesson.slug ?? lesson.id))) throw new BadRequestException("Existing sections must retain their IDs and slugs.");
        }
      }
      const course = id ? await db.course.update({ where: { id }, data }) : await db.course.create({ data: { ...data, instructorId: actor.userId } });
      for (const [order, module] of modules.entries()) {
        let saved;
        if (module.id) {
          const existing = await db.courseModule.findFirst({ where: { id: module.id, courseId: course.id } });
          if (!existing) throw new BadRequestException("Module does not belong to this path");
          saved = await db.courseModule.update({ where: { id: module.id }, data: { title: module.title, slug: module.slug, order } });
        } else saved = await db.courseModule.create({ data: { title: module.title, slug: module.slug, order, courseId: course.id } });
        for (const [lessonOrder, lesson] of module.lessons.entries()) {
          const lessonData = { title: lesson.title, slug: lesson.slug, content: lesson.content, objectives: lesson.objectives, assessment: lesson.assessment, order: lessonOrder };
          if (lesson.id) {
            const existing = await db.lesson.findFirst({ where: { id: lesson.id, moduleId: saved.id } });
            if (!existing) throw new BadRequestException("Section does not belong to this module");
            if (JSON.stringify(existing.assessment) !== JSON.stringify(lesson.assessment) && (await db.learningProgress.count({ where: { lessonId: lesson.id, completed: true } }) || await db.quizResult.count({ where: { quiz: { lessonId: lesson.id } } }))) throw new ConflictException("An assessment with attempts cannot change. Create a new lesson version.");
            await db.lesson.update({ where: { id: lesson.id }, data: lessonData });
            await db.quiz.upsert({ where: { lessonId: lesson.id }, create: { lessonId: lesson.id, ...lesson.assessment }, update: lesson.assessment });
          } else {
            const created = await db.lesson.create({ data: { ...lessonData, moduleId: saved.id } });
            await db.quiz.create({ data: { lessonId: created.id, ...lesson.assessment } });
          }
        }
      }
      return { id: course.id, slug: course.slug };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  }
}
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }