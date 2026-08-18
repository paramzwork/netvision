import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
/**
 * Strongly typed JWT payload
 */
export interface AuthTokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Safely get secret (TypeScript safe)
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return secret;
}

/**
 * Sign Token
 */
export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "1d",
  });
}

/**
 * Verify Token
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get("WVRKc2MySkJQVDA9")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }
    return await prisma.users.findUnique({
      where: {
        id: Number(payload.id),
      },
      include: {
        roles: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const userRole = user.roles?.role;

  console.log("Required roles:", allowedRoles);
  console.log("Actual role:", userRole);

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log("ACCESS DENIED");
    redirect("/dashboard");
  }

  console.log("ACCESS GRANTED");

  return user;
}