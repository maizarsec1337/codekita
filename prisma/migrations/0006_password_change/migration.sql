ALTER TABLE "public"."User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN "developmentBootstrap" BOOLEAN NOT NULL DEFAULT false;