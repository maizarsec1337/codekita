import { PrismaClient } from "@prisma/client";
// Deliberate operator-only provisioning; never creates an account or a password.
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) throw new Error("Usage: pnpm --filter @codekita/backend admin:grant <registered-email>");
const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) throw new Error("An active registered account is required.");
  const role = await prisma.role.upsert({ where: { name: "ADMIN" }, create: { name: "ADMIN" }, update: {} });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, create: { userId: user.id, roleId: role.id }, update: {} });
  console.log("Administrator role assigned. Sign in again to refresh the UI.");
} finally { await prisma.$disconnect(); }