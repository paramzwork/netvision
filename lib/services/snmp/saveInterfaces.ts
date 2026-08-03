import { PrismaClient } from "@/lib/generated/prisma/client";
import { InterfaceTypes } from "@/lib/types";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function saveInterfaces(data: InterfaceTypes[]) {
  await prisma.interfaces.createMany({
    data,
    skipDuplicates: true,
  });

  return {
    message: "Interface added successfully.",
  };
}
