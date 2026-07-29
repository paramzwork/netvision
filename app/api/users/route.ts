import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function GET() {
  const users = await prisma.users.findMany({
    include: {
      roles: true,
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
    await prisma.users.create({
      data: {
        username: body.username,
        firstname: body.firstname,
        middlename: body.middlename,
        lastname: body.lastname,
        email: body.email,
        password: hashedPassword,
        roles: {
          connect: {
            id: body.roleId,
          },
        },
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
