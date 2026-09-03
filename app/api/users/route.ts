import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
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
  const where = {
    role_id: {
      not: 1,
    },
  };

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role_id: true,
        suffix: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.users.count({
      where,
    }),
  ]);

  return NextResponse.json({
    data: users,
    total,
  });
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    console.log(body);
    // Validate required fields
    if (!body.firstname || !body.email || !body.password || !body.roleId) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        username: body.username,
        firstname: body.firstname,
        lastname: body.lastname,
        email: body.email,
        password: hashedPassword,
        roles: {
          connect: {
            id: body.roleId,
          },
        },
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role_id: true,
        suffix: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
    });
    return NextResponse.json(
      {
        data: user,
        message: "Account created successfully.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
