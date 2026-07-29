import { PrismaClient } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { tripleDecode } from "@/lib/utils";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;
//   const decodedID = tripleDecode(id);
//   const body = await req.json();

//   const role = await prisma.users.update({
//     where: {
//       id: Number(decodedID),
//     },
//     data: {
//       username: body.username,
//       firstname: body.firstname,
//       lastname: body.lastname,
//       password: body.password,
//       role_id: body.role,
//     },
//   });
//   const encodedID = tripleEncode(String(role.id));
//   return NextResponse.json({
//     data: encodedID,
//     roleID: role.role_id,
//     createdAt: role.createdAt,
//     updatedAt: role.updatedAt,
//     message: "User updated successfully.",
//   });
// }

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const decodedID = tripleDecode(id);
  await prisma.users.delete({
    where: {
      id: Number(decodedID),
    },
  });

  return NextResponse.json({
    message: "User deleted successfully.",
  });
}
