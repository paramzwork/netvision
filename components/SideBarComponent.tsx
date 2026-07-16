"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Coffee,
  LogOut,
  Server,
  Search,
  BarChart,
  Logs,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useData } from "@/context/DataContext";
import { User } from "@/lib/types";

export const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["admin", "superadmin"],
  },
  {
    name: "Terminal Nodes",
    icon: Server, // Main icon for the category
    href: "/terminal-nodes", // Parent link can go to the overview
    roles: ["superadmin"],
    subMenu: [
      {
        name: "Node Overview",
        icon: BarChart, // Or a more specific icon
        href: "/terminal-nodes", // Page to view all node data
      },
      {
        name: "Find by Client",
        icon: Search,
        href: "/terminal-nodes/search", // Page with a search input for a specific client
      },
      {
        name: "Logs",
        icon: Logs,
        href: "/terminal-nodes/logs", // Page with a search input for a specific client
      },
    ],
  },
];
interface SidebarProps {
  currentUser: Partial<User> | null;
  fiberKill: string;
}
export default function SidebarComponent({ currentUser, fiberKill }: SidebarProps) {
  const { setFVKill } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");

    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      toast.success("Logged out successfully", {
        id: toastId,
      });

      router.push("/");
    } catch {
      toast.error("Logout failed", {
        id: toastId,
      });
    }
  };
  useEffect(() => {
    if (fiberKill) {
      setFVKill(fiberKill);
    }
  }, [fiberKill, setFVKill]);
  const filteredMenu = menuItems.filter(
    (item) => !item.roles || item.roles.includes(currentUser?.role ?? ""),
  );
  return (
    <aside
      className={`
    ${collapsed ? "w-20" : "w-72"}
    bg-white
    min-h-screen flex flex-col
    transition-all duration-300 ease-in-out
    relative font-lexend
    border-r border-gray-200
    overflow-visible text-sm text-slate-700
  `}
    >
      {/* ================= LOGO ================= */}
      <div className={`flex items-center gap-3 px-6 border-b border-gray-200 ${!collapsed ? "py-3.25": "py-3.5"}`}>
        <div className="w-10 h-10 bg-linear-to-br from-[#0ea5e9] to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
          <Coffee className="w-5 h-5 text-white" />
        </div>

        {!collapsed && (
          <div>
            <h1 className=" font-semibold text-lg tracking-wide">DCS</h1>
            <p className="text-gray-500 text-xs tracking-wide capitalize">
              {currentUser?.role} Dashboard
            </p>
          </div>
        )}
      </div>

      {/* ================= COLLAPSE BUTTON ================= */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
      absolute -right-3 top-14 w-7 h-7
      bg-white border border-gray-300
      rounded-full flex items-center justify-center
      text-gray-500 hover:text-gray-900 hover:bg-gray-100
      transition-all shadow-sm cursor-pointer
      z-10
    "
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-3 py-6">
        <p
          className={`text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 ${
            collapsed ? "text-center" : "px-4"
          }`}
        >
          {collapsed ? "•••" : ""}
        </p>

        <Accordion
          type="single"
          collapsible
          defaultValue={
            menuItems.find((item) =>
              item.subMenu?.some((sub) => pathname.startsWith(sub.href)),
            )?.name
          }
          className="space-y-1"
        >
          {filteredMenu.map((item) => {
            const hasSubMenu = item.subMenu?.length;
            const isActive =
              pathname === item.href ||
              item.subMenu?.some((sub) => pathname.startsWith(sub.href));

            /* ================= NO SUBMENU ================= */
            if (!hasSubMenu) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                group flex items-center gap-3
                ${collapsed ? "justify-center px-0" : "px-2"}
                py-3 rounded-xl relative
                transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
                >
                  <div
                    className={`
                  flex items-center justify-center rounded-lg shrink-0
                  ${collapsed ? "w-10 h-10" : "w-9 h-9"}
                  ${
                    isActive
                      ? "bg-indigo-100"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }
                `}
                  >
                    <item.icon
                      className={`${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
                    />
                  </div>

                  {!collapsed && (
                    <span className="font-semibold text-sm">{item.name}</span>
                  )}

                  {/* Tooltip */}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            }

            /* ================= WITH SUBMENU ================= */
            return (
              <AccordionItem
                key={item.name}
                value={item.name}
                className="border-none"
              >
                <AccordionTrigger
                  className={`
                group flex items-center gap-3
                ${collapsed ? "justify-center px-0" : "px-2"}
                py-3 rounded-xl hover:no-underline
                transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
                >
                  <div
                    className={`
                  flex items-center justify-center rounded-lg shrink-0
                  ${collapsed ? "w-10 h-10" : "w-9 h-9"}
                  ${
                    isActive
                      ? "bg-indigo-100"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }
                `}
                  >
                    <item.icon
                      className={`${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
                    />
                  </div>

                  {!collapsed && (
                    <span className="font-lexend font-semibold text-sm">
                      {item.name}
                    </span>
                  )}

                  {collapsed && (
                    <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-xs text-white rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                      {item.name}
                    </span>
                  )}
                </AccordionTrigger>

                {!collapsed && (
                  <AccordionContent className="pl-10 pt-1 space-y-1">
                    {item.subMenu?.map((sub) => {
                      const isSubActive = pathname === sub.href;

                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        transition-all duration-200
                        ${
                          isSubActive
                            ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent"
                        }
                      `}
                        >
                          <sub.icon className="w-4 h-4 shrink-0 opacity-70" />
                          <span className="font-lexend text-sm">
                            {sub.name}
                          </span>
                        </Link>
                      );
                    })}
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>

      {/* ================= BOTTOM ================= */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`
        group flex items-center gap-3 px-4 py-3 rounded-xl
        text-gray-600 hover:bg-red-50 hover:text-red-600
        transition-all duration-200 w-full cursor-pointer
        ${collapsed ? "justify-center px-2" : ""}
      `}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ================= USER ================= */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow">
              {currentUser?.name?.charAt(0) ?? "U"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">
                {currentUser?.name}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {currentUser?.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
