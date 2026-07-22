import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

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
  username: string;
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
  const token = (await cookies()).get("WTBkR2VWbFhNVFk9")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    return await prisma.users.findUnique({
      where: {
        id: payload.id,
      },
      include: {
        roles: true,
      },
    });
  } catch {
    return null;
  }
}