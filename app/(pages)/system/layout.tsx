import { requireRole } from "@/lib/auth";
import React from "react";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["Admin", "Super Admin"]);
  return <>{children}</>;
}
