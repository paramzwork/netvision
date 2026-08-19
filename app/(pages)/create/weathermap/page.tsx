"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import WeatherMapComponent from "@/components/WeatherMapComponent";

export default function WeatherMapCreate() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Weathermaps",
              href: "/weathermap",
            },
            {
              label: "Create",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-lg font-bold">Create Weathermap</h1>
        </div>
      </div>

      <div className="w-full">
        <WeatherMapComponent />
      </div>
    </div>
  );
}
