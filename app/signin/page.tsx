import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SignInComponent from "./SignInComponent";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const userCount = await prisma.users.count();

  if (userCount === 0) {
    redirect("/signup");
  }

  return <SignInComponent />;
}