import { cookies } from "next/headers";
import { DataProvider } from "@/context/DataContext";
import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import HeaderComponent from "@/components/HeaderComponent";
import SidebarComponent from "@/components/SideBarComponent";
import { getCurrentUser } from "@/lib/auth";
import { ReactFlowProvider } from "@xyflow/react";
import { DnDProvider } from "@/components/DnDContext";

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
    <DataProvider currentUser={currentUser}>
      <ReactFlowProvider>
        <DnDProvider>
          <div className="flex w-full h-screen overflow-hidden bg-gray-100 font-sans">
            <SidebarComponent />
            <div className="w-full h-full min-h-0 flex flex-col">
              <HeaderComponent />
              <div className="w-full flex-1 min-h-0 p-6 overflow-y-auto">
                <TooltipProvider delay={500}>{children}</TooltipProvider>
              </div>
            </div>
          </div>
        </DnDProvider>
      </ReactFlowProvider>
    </DataProvider>
  );
}
