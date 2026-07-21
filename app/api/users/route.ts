import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET() {
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.firstname || !body.email || !body.password || !body.roleId) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
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
    await prisma.user.create({
      data: {
        firstname: body.firstname,
        middlename: body.middlename,
        lastname: body.lastname,
        email: body.email,
        password: hashedPassword,
        roleId: body.roleId,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully.",
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
