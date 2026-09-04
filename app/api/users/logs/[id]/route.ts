import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tripleDecode } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const decodedID = tripleDecode(id);

    const where = { id: Number(decodedID) };
    await prisma.user_logs.delete({ where });

    return NextResponse.json({
      message: "Log deleted successfully.",
    });
  } catch (error) {
    console.error("Create user log error:", error);

    return NextResponse.json(
      { message: "Failed to create user log" },
      { status: 500 },
    );
  }
}
