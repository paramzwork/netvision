import { prisma } from "./prisma";

interface CreateUserLogParams {
  userId?: number | null;
  action: string;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createUserLog({
  userId,
  action,
  description,
  ipAddress,
  userAgent,
}: CreateUserLogParams) {
  try {
    await prisma.user_logs.create({
      data: {
        user_id: userId ?? null,
        action,
        description: description ?? null,
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create user log:", error);
  }
}
