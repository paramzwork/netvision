import { requireRole } from "@/lib/auth";

export default async function WeatherMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["Admin", "Super Admin"]);

  return <>{children}</>;
}
