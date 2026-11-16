import { Prisma, PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

for (const file of [".env.local", ".env"]) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) process.env[key] ??= value;
}
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
let database;
try { database = new URL(process.env.DATABASE_URL); } catch { throw new Error("Set a local development DATABASE_URL."); }
if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) throw new Error("Development bootstrap requires NODE_ENV=development and a loopback database.");
if (!password || password.length < 8 || password.length > 256 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Provide ADMIN_EMAIL and ADMIN_PASSWORD privately in the environment.");
const prisma = new PrismaClient();
try {
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const result = await prisma.$transaction(async db => {
    await db.$queryRaw`SELECT pg_advisory_xact_lock(439421, 1)::text`;
    const existing = await db.user.findFirst({ where: { OR: [{ username: "admin" }, { email }, { email: "admin" }] }, include: { roles: { include: { role: true } } } });
    if (existing) {
      if (existing.username !== "admin" || existing.email !== email || !existing.roles.some(item => item.role.name === "SUPER_ADMIN")) throw new Error("Account collision; no changes made.");
      return "Existing super administrator left unchanged; password was not reset.";
    }
    if (await db.user.count({ where: { roles: { some: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } } } } })) throw new Error("An administrator already exists; no changes made.");
    const role = await db.role.upsert({ where: { name: "SUPER_ADMIN" }, create: { name: "SUPER_ADMIN" }, update: {} });
    await db.user.create({ data: { email, username: "admin", passwordHash: hash, mustChangePassword: true, developmentBootstrap: true, roles: { create: { roleId: role.id } } } });
    return "Development super administrator created; password change is required.";
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  console.log(result);
} catch (error) {
  if (error instanceof Error && ["Account collision; no changes made.", "An administrator already exists; no changes made."].includes(error.message)) console.error(error.message);
  else console.error("Development bootstrap failed. Check local database and migrations; no credentials are logged.");
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }