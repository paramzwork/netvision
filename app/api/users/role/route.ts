import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function GET() {
  const roles = await prisma.roles.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json(roles);
}

export async function POST(req: Request) {
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
