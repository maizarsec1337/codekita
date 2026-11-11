-- Additive only. Review migration history / baseline before applying to an existing DB.
CREATE TABLE "Profile" (
  "userId" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "displayName" TEXT NOT NULL DEFAULT '', "bio" TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Permission" ("id" UUID PRIMARY KEY, "name" TEXT NOT NULL);
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");
CREATE TABLE "RolePermission" (
  "roleId" UUID NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);
CREATE TABLE "Category" (
  "id" UUID PRIMARY KEY, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '', "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
ALTER TABLE "Course" ADD COLUMN "categoryId" UUID, ADD COLUMN "instructorId" UUID;
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Preserve existing academy values and associate their courses, without rewriting content.
INSERT INTO "Category" ("id", "slug", "name", "updatedAt")
SELECT gen_random_uuid(), "academy", initcap("academy"), CURRENT_TIMESTAMP FROM "Course" GROUP BY "academy";
UPDATE "Course" SET "categoryId" = "Category"."id" FROM "Category" WHERE "Course"."academy" = "Category"."slug";
CREATE TABLE "Quiz" (
  "id" UUID PRIMARY KEY, "lessonId" UUID NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question" TEXT NOT NULL, "options" TEXT[] NOT NULL, "correctIndex" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Quiz_answer_valid" CHECK ("correctIndex" >= 0 AND "correctIndex" < cardinality("options"))
);
CREATE UNIQUE INDEX "Quiz_lessonId_key" ON "Quiz"("lessonId");
-- Legacy Lesson.assessment stays intact; the service upgrades validated assessments on use.
CREATE TABLE "QuizResult" (
  "id" UUID PRIMARY KEY, "quizId" UUID NOT NULL REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "answer" INTEGER NOT NULL, "passed" BOOLEAN NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "QuizResult_userId_createdAt_idx" ON "QuizResult"("userId", "createdAt");
CREATE TABLE "Lab" (
  "id" TEXT PRIMARY KEY, "academy" TEXT NOT NULL, "title" TEXT NOT NULL, "language" TEXT NOT NULL,
  "duration" TEXT NOT NULL, "description" TEXT NOT NULL, "starter" TEXT NOT NULL, "sample" TEXT NOT NULL,
  "objectives" TEXT[] NOT NULL, "hint" TEXT NOT NULL, "isPublished" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE "LabDraft" (
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "labId" TEXT NOT NULL REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "code" TEXT NOT NULL, "language" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("userId", "labId")
);
CREATE TABLE "CurriculumTemplate" ("slug" TEXT PRIMARY KEY, "content" JSONB NOT NULL);