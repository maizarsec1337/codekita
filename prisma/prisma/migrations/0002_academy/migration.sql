-- Additive academy upgrade: existing courses, accounts, and progress are preserved.
ALTER TABLE "Course" ADD COLUMN "academy" TEXT NOT NULL DEFAULT 'programming',
  ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
  ADD COLUMN "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "prerequisites" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CourseModule" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "CourseModule_slug_key" ON "CourseModule"("slug");
ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT,
  ADD COLUMN "objectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "assessment" JSONB;
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");
ALTER TABLE "LearningProgress" ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT NOT NULL DEFAULT '', ADD COLUMN "bookmarked" BOOLEAN NOT NULL DEFAULT false;
-- Do not invent historical completion dates or award retroactive XP.
CREATE TABLE "XpEvent" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "eventKey" TEXT NOT NULL,
  "amount" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "XpEvent_userId_eventKey_key" ON "XpEvent"("userId", "eventKey");
CREATE INDEX "XpEvent_userId_createdAt_idx" ON "XpEvent"("userId", "createdAt");
CREATE TABLE "Certificate" (
  "id" UUID NOT NULL, "enrollmentId" UUID NOT NULL, "title" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Certificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Certificate_enrollmentId_key" ON "Certificate"("enrollmentId");