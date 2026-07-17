import jwt, { JwtPayload } from "jsonwebtoken";

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
