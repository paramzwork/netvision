import { cookies } from "next/headers";
import { DataProvider } from "@/context/DataContext";
import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import HeaderComponent from "@/components/HeaderComponent";
import SidebarComponent from "@/components/SideBarComponent";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("WVRKc2MySkJQVDA9")?.value;
  if (!token) {
    redirect("/");
  }
  let currentUser = null;
  try {
     currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/");
    }
  } catch {
    redirect("/");
  }

  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
        <SidebarComponent currentUser={currentUser} />
        <div className="flex flex-col flex-1">
          <HeaderComponent />
          <main className="p-6 overflow-y-auto">
            <TooltipProvider>{children}</TooltipProvider>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
