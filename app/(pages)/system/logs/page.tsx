import Breadcrumbs from "@/components/Breadcrumbs";
import UsersLogsPage from "@/components/UsersLogs";
import { Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function LogsPage() {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Logs",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-bold">Users Logs</h1>
          <Link href={"/settings/devices"}>
            <Settings className="shrink-0 w-5 h-5" />
          </Link>
        </div>
        <UsersLogsPage />
      </div>
    </div>
  );
}
