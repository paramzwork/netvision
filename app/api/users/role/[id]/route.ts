import { NextRequest, NextResponse } from "next/server";
import { tripleDecode, tripleEncode } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestInfo } from "../../route";
import { createUserLog } from "@/lib/logs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
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
  const { ipAddress, userAgent } = getRequestInfo(req);

  await createUserLog({
    userId: currentUser.id,
    action: "UPDATE_ROLE",
    description: `Update role "${role.role}"`,
    ipAddress,
    userAgent,
  });
  return NextResponse.json({
    data: encodedID,
    role: role.role,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    message: "Role updated successfully.",
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const decodedID = tripleDecode(id);
  const role = await prisma.roles.delete({
    where: {
      id: Number(decodedID),
    },
  });
  const { ipAddress, userAgent } = getRequestInfo(req);

  await createUserLog({
    userId: currentUser.id,
    action: "DELETE_ROLE",
    description: `Deleted role "${role.role}"`,
    ipAddress,
    userAgent,
  });
  return NextResponse.json({
    message: "Role deleted successfully.",
  });
}
