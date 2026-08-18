import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required." },
      { status: 400 },
    );
  }

  try {
    // Make sure initial setup is still allowed
    const userCount = await prisma.users.count();

    if (userCount > 0) {
      return NextResponse.json(
        { message: "Account setup has already been completed." },
        { status: 403 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        username,
        firstname: "",
        lastname: "",
        email: "",
        password: hashedPassword,
        roles: {
          connect: {
            role: "Super Admin",
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
