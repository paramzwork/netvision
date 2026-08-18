import { requireRole } from "@/lib/auth";

export default async function WeatherMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["User","Admin", "Super Admin"]);

  return <>{children}</>;
}
