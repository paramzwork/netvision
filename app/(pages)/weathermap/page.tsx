"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function WeatherMap() {

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Weathermap",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">Weathermap</h1>
          <Link href={"/settings/weathermap"}>
            <Settings className="shrink-0 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
