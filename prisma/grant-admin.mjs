import { PrismaClient } from "@prisma/client";
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
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) throw new Error("An active registered account is required.");
  const role = await prisma.role.upsert({ where: { name: roleName }, create: { name: roleName }, update: {} });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, create: { userId: user.id, roleId: role.id }, update: {} });
  console.log("Administrator role assigned. Sign in again to refresh the UI.");
} catch { console.error("Admin provisioning failed. Verify an active registered account, migrations and role seed. Credentials are not logged."); process.exitCode = 1; }
finally { await prisma.$disconnect(); }