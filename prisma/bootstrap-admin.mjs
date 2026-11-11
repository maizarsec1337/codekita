import { Prisma, PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

for (const file of [".env.local", ".env"]) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) process.env[key] ??= value;
}

const recover = process.argv.length === 3 && process.argv[2] === "--recover-existing";
if (process.argv.length > (recover ? 3 : 2)) throw new Error("Only --recover-existing is supported");
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const username = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    !/^[a-z][a-z0-9_-]{2,31}$/.test(username) || username.includes("@") ||
    !password || password.length < 16 || password.length > 256 ||
    !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password) || password.toLowerCase().includes(username)) {
  throw new Error("Provide ADMIN_EMAIL, ADMIN_USERNAME (optional), and a new strong ADMIN_PASSWORD (16–256 characters, mixed case, digit, symbol; must not contain username).");
}

const prisma = new PrismaClient();
try {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.ARGON2ID_MEMORY_COST || 65536),
    timeCost: Number(process.env.ARGON2ID_TIME_COST || 3),
    parallelism: Number(process.env.ARGON2ID_PARALLELISM || 4),
  });
  const outcome = await prisma.$transaction(async db => {
    // Serialize operator bootstrap/recovery attempts on this database.
    await db.$queryRaw`SELECT pg_advisory_xact_lock(439421, 1)::text`;
    const admins = await db.user.count({ where: { roles: { some: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } } } } });
    if (recover) {
      const user = await db.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
      if (!user?.isActive || !user.roles.some(item => item.role.name === "ADMIN" || item.role.name === "SUPER_ADMIN")) {
        throw new Error("Recovery requires an existing active administrator matching ADMIN_EMAIL; no account was changed.");
      }
      if (user.username && user.username !== username) throw new Error("Account already has a different username; no account was changed.");
      const collision = await db.user.findFirst({ where: { OR: [{ email: username }, { username }] }, select: { id: true } });
      if (collision && collision.id !== user.id) throw new Error("Username belongs to another account; no account was changed.");
      if (user.passwordHash && await argon2.verify(user.passwordHash, password).catch(() => false)) {
        throw new Error("Choose a different password; no account was changed.");
      }
      await db.user.update({ where: { id: user.id }, data: { username, passwordHash: hash } });
      await db.session.deleteMany({ where: { userId: user.id } });
      return "Existing administrator credentials updated on explicit operator request; prior sessions revoked.";
    }
    if (admins) throw new Error("An administrator already exists. No account was created or changed. For authorized recovery use --recover-existing with the exact existing ADMIN_EMAIL.");
    if (await db.user.findUnique({ where: { email } }) || await db.user.findUnique({ where: { email: username } }) || await db.user.findUnique({ where: { username } })) {
      throw new Error("Email or username already exists; no account was changed.");
    }
    const role = await db.role.findUnique({ where: { name: "ADMIN" } });
    if (!role) throw new Error("ADMIN role is missing. Run npm run db:seed before bootstrap.");
    await db.user.create({ data: { email, username, passwordHash: hash, emailVerified: true, roles: { create: { roleId: role.id } } } });
    return "First administrator created. Sign in using the configured username or email.";
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  console.log(outcome);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") console.error("Email or username already belongs to an account. Nothing was changed.");
  else if (error instanceof Error && !error.message.includes("\n") && !/postgresql:|password=/i.test(error.message)) console.error(error.message);
  else console.error("Administrator setup failed. Check database connectivity and migrations; credentials were not printed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}