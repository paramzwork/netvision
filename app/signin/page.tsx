import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SignInComponent from "./SignInComponent";

export default async function SignUpPage() {
  const userCount = await prisma.users.count();

  if (userCount === 0) {
    redirect("/signup");
  }

  return <SignInComponent />;
}