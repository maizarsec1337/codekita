import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  for (const name of ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name} role` } });
  }
  console.log("Role definitions created. No user accounts or credentials were seeded.");
} finally { await prisma.$disconnect(); }