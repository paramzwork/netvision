import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);

  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 20, 1),
    100,
  );
  const skip = (page - 1) * limit;
  const [roles, total] = await Promise.all([
    prisma.roles.findMany({
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
    }),
    prisma.roles.count(),
  ]);

  return NextResponse.json({ data: roles, total });
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.role) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({
      where: {
        role: body.role,
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { message: "Role already exists." },
        { status: 409 },
      );
    }

    // Create role
    await prisma.roles.create({
      data: {
        role: body.role,
      },
    });

    return NextResponse.json(
      {
        message: "Role created successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
