import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roleNames = ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"];

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} role`,
      },
    });
  }

  console.log("Seeded roles:", roleNames);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();

// Seed development admin account (username: admin, password: admin123)
const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
if (adminRole) {
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@codekita.id" } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin@codekita.id",
        passwordHash: "$2b$10$NqH5yLPro8x1yw/92u34Vu6OQJ/sd3fHKxDx.Q.R1YKw2ZAuUf.k6",
        isActive: true,
        roles: {
          create: { roleId: adminRole.id }
        }
      },
    });
    console.log("Seeded development admin account");
  }
}
  });