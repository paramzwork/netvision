import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Home() {
  const userCount = await prisma.users.count();

  if (userCount === 0) {
    redirect("/signup");
  }

  redirect("/signin");
}
