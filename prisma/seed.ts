import { prisma } from "@/lib/prisma";

async function main() {
  const roles = ["Super Admin", "Admin", "User"];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: {
        role,
      },
      update: {},
      create: {
        role,
      },
    });
  }

  console.log("Default roles created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
