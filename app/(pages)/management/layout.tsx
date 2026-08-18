import { requireRole } from "@/lib/auth";
import React from "react";

export default async function MangamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["User", "Admin", "Super Admin"]);
  return <>{children}</>;
}
