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
  });