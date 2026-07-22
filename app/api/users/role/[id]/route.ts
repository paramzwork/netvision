import { PrismaClient } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { tripleDecode, tripleEncode } from "@/lib/utils";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const decodedID = tripleDecode(id);
  const body = await req.json();

  const role = await prisma.roles.update({
    where: {
      id: Number(decodedID),
    },
    data: {
      role: body.role,
    },
  });
  const encodedID = tripleEncode(String(role.id));
  return NextResponse.json({
    data: encodedID,
    role: role.role,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    message: "Role updated successfully.",
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const decodedID = tripleDecode(id);
  await prisma.roles.delete({
    where: {
      id: Number(decodedID),
    },
  });

  return NextResponse.json({
    message: "Role deleted successfully.",
  });
}
