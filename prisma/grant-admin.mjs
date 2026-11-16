import { Prisma, PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
for (const file of [".env.local", ".env"]) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) process.env[key] ??= value;
}
// Deliberate operator-only provisioning; never creates an account or a password.
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) throw new Error("Usage: npm run admin:grant -- <registered-email> [ADMIN|SUPER_ADMIN]");
const roleName = process.argv[3] ?? "ADMIN";
if (!["ADMIN", "SUPER_ADMIN"].includes(roleName)) throw new Error("Unsupported provisioning role");
const prisma = new PrismaClient();
try {
  await prisma.$transaction(async db => {
    const user = await db.user.findUnique({ where: { email } });
    if (!user?.isActive || user.developmentBootstrap || user.mustChangePassword || !user.passwordHash) throw new Error("An active account with a rotated password is required.");
    const role = await db.role.upsert({ where: { name: roleName }, create: { name: roleName }, update: {} });
    await db.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, create: { userId: user.id, roleId: role.id }, update: {} });
    await db.session.deleteMany({ where: { userId: user.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log("Administrator role assigned; previous sessions revoked. Sign in again.");
} catch { console.error("Admin provisioning failed. Verify an active registered account, migrations and role seed. Credentials are not logged."); process.exitCode = 1; }
finally { await prisma.$disconnect(); }