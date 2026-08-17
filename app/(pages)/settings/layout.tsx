import { requireRole } from "@/lib/auth";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["Admin", "Super Admin"]);

  return <>{children}</>;
}
