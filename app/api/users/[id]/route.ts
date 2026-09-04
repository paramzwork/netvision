import { NextRequest, NextResponse } from "next/server";
import { tripleDecode } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getRequestInfo } from "../route";
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

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const user = await prisma.users.update({
    where: {
      id: Number(decodedID),
    },
    data: {
      username: body.username,
      firstname: body.firstname,
      lastname: body.lastname,
      email: body.email,
      password: hashedPassword,
      role_id: body.roleId,
    },
    select: {
      id: true,
      username: true,
      firstname: true,
      lastname: true,
      email: true,
      createdAt: true,
      role_id: true,
      roles: true,
    },
  });
  console.log(user);
  const { ipAddress, userAgent } = getRequestInfo(req);

  await createUserLog({
    userId: currentUser.id,
    action: "UPDATE_USER",
    description: `Update user "${user.username}"`,
    ipAddress,
    userAgent,
  });
  return NextResponse.json({
    data: user,
    message: "Account updated successfully!",
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
  const user = await prisma.users.delete({
    where: {
      id: Number(decodedID),
    },
  });
  const { ipAddress, userAgent } = getRequestInfo(req);

  await createUserLog({
    userId: currentUser.id,
    action: "DELETE_USER",
    description: `Delete user "${user.username}"`,
    ipAddress,
    userAgent,
  });
  return NextResponse.json({
    message: "User deleted successfully.",
  });
}
