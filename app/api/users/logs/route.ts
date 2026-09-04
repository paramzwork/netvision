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

  const requestedLimit = Number(searchParams.get("limit")) || 20;

  const limit = Math.min(Math.max(requestedLimit, 1), 20);

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.user_logs.findMany({
      skip,
      take: limit,

      include: {
        users: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            role_id: true,
            roles: {
              select: {
                id: true,
                role: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user_logs.count(),
  ]);

  return NextResponse.json({
    data: logs,
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { user_id, action, description, ip_address, user_agent } = body;

    if (!action) {
      return NextResponse.json(
        { message: "Action is required" },
        { status: 400 },
      );
    }

    const log = await prisma.user_logs.create({
      data: {
        user_id: user_id ?? currentUser.id,
        action,
        description: description ?? null,
        ip_address: ip_address ?? null,
        user_agent: user_agent ?? null,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "User log created successfully",
        data: log,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user log error:", error);

    return NextResponse.json(
      { message: "Failed to create user log" },
      { status: 500 },
    );
  }
}
