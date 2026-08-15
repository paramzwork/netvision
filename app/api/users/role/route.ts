import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const roles = await prisma.roles.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json(roles);
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
