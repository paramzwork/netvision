import SignUpComponent from "@/app/signup/SignUpComponent";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const userCount = await prisma.users.count();

  if (userCount > 0) {
    redirect("/signin");
  }

  return <SignUpComponent />;
}