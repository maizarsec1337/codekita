ALTER TABLE "public"."Certificate" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE TABLE "public"."PlatformSetting" (
  "id" TEXT NOT NULL,
  "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformSetting_singleton" CHECK ("id" = 'platform')
);
ALTER TABLE "public"."PlatformSetting" ENABLE ROW LEVEL SECURITY;
CREATE INDEX "Certificate_issuedAt_id_idx" ON "public"."Certificate" ("issuedAt" DESC, "id");
CREATE INDEX "LearningProgress_completedAt_id_idx" ON "public"."LearningProgress" ("completedAt" DESC, "id");