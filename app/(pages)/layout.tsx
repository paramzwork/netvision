import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { DataProvider } from "@/context/DataContext";
import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { User } from "@/lib/types";
import HeaderComponent from "@/components/HeaderComponent";
import SidebarComponent from "@/components/SideBarComponent";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerList = await headers();

  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const baseUrl = `${protocol}://${host}`;

  const token = cookieStore.get("WTBkR2VWbFhNVFk9")?.value;
  let currentUser = null;
  let cactiKill = null;
  if (!token) {
    redirect("/");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const payload = {
      login_username: "admin_nichole",
      login_password: "Admin@101",
      action: "login",
      remember_me: "on",
    };
    const [res, cactiRes] = await Promise.all([
      fetch(`${baseUrl}/api/users`, {
        method: "GET",
        cache: "no-store",
      }),
      fetch(`${baseUrl}/api/request?type=cacti-sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }),
    ]);
    const localData = await res.json();
    const cactiData = await cactiRes.json();

    if (!res.ok || !cactiRes.ok) {
      redirect("/");
    }

    if (!Array.isArray(localData)) {
      console.error("Users is not an array:", localData);
      return;
    }
    const foundUser = localData.find(
      (u: User) => String(u.id) === String(decoded.id),
    );
    console.log(cactiData.cookie)
    if (foundUser) {
      currentUser = foundUser;
      cactiKill = cactiData.token.id;
    }
  } catch (error) {
    console.error("Invalid token:", error);
  }

  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
        <SidebarComponent currentUser={currentUser} cactiKill={cactiKill} />
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
