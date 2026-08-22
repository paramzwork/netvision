import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { tripleEncode } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: {
        username,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password ?? "");

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_id,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    const response = NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.roles.role,
      },
    });
    const kill = tripleEncode("kill");
    const maxAgeByRole: Record<string, number> = {
      "Super Admin": 60 * 60 * 24, // 24 hours
      Admin: 60 * 60 * 8, // 8 hours
      User: 60 * 60, // 1 hour
    };

    const maxAge = maxAgeByRole[user.roles.role] ?? 60 * 60;
    response.cookies.set(kill, token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
