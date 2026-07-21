"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Server,
  BarChart,
  Monitor,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NavLink, NavSubMenu, User } from "@/lib/types";
import Image from "next/image";

export type MenuItem = NavLink | NavSubMenu;

export const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["admin", "superadmin"],
  },
  {
    name: "Devices",
    icon: Monitor,
    href: "/devices",
    roles: ["admin", "superadmin"],
  },
  {
    name: "Users",
    icon: UserIcon,
    href: "/management/users",
    roles: ["admin", "superadmin"],
  },
  {
    name: "System", // Renamed to avoid duplicate name conflict
    icon: Server,
    subMenu: [
      {
        name: "Test page",
        icon: BarChart,
        href: "/dsadf",
        roles: ["superadmin"],
      },
    ],
  },
];
interface SidebarProps {
  currentUser: Partial<User> | null;
}
export default function SidebarComponent({ currentUser }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");

    try {
      await fetch("/api/request?type=sign-out", {
        method: "POST",
      });

      toast.success("Logged out successfully", {
        id: toastId,
      });

      router.push("/");
    } catch {
      toast.error("Sign Out failed", {
        id: toastId,
      });
    }
  };
  const filteredMenu = menuItems.filter(
    (item) => !item.roles || item.roles.includes(currentUser?.roles?.role ?? ""),
  );
  const defaultItem = menuItems.find((item) =>
    item.subMenu?.some((sub) => pathname.startsWith(sub.href)),
  )?.name;
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
      <div
        className={`flex items-center gap-3 px-6 border-b border-gray-200 bg-slate-700 text-white ${!collapsed ? "py-3.25" : "py-3.5"}`}
      >
        <div className="w-10 h-10 bg-linear-to-br from-[#f4f5f5] to-gray-300 rounded-xl flex items-center justify-center shadow-md">
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="relative h-15 w-15">
              <Image
                src="/images/nv-logo.png"
                alt="NetVision Logo"
                fill
                priority
                sizes="500px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {!collapsed && (
          <div>
            <h1 className=" font-semibold text-lg tracking-wide">NetVision</h1>
            <p className="text-gray-300 text-xs tracking-wide capitalize">
              {currentUser?.roles?.role} Dashboard
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
          multiple
          defaultValue={defaultItem ? [defaultItem] : []}
          className="space-y-1"
        >
          {filteredMenu.map((item) => {
            /* ================= NO SUBMENU (Standard Link) ================= */
            // TypeScript Type Guard: If 'href' exists, it MUST be a NavLink type
            if (item.href) {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href} // TypeScript now knows 100% this is a string!
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
              ${isActive ? "bg-indigo-100" : "bg-gray-100 group-hover:bg-gray-200"}
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

            /* ================= WITH SUBMENU (Accordion) ================= */
            // Since item.href is undefined, TypeScript knows this MUST be a NavSubMenu type
            const isActive = item.subMenu?.some((sub) =>
              pathname.startsWith(sub.href),
            );

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
              ${isActive ? "bg-indigo-100" : "bg-gray-100 group-hover:bg-gray-200"}
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
          {!collapsed && <span>Sign Out</span>}
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
                {currentUser?.roles?.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
