"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import OverviewWeathermapTable from "@/components/table/OverviewWeathermapTable";
import { useTopologyStore } from "@/store/topology-store";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export interface TopologyTypes {
  id: number;
  name: string;
  description: string;
}
export default function WeatherMapPage() {
  const { topologies, setTopologies } = useTopologyStore();
  const hasMountedRef = useRef<boolean>(false);
  const fetchWeathermap = useCallback(async () => {
    if (topologies.length !== 0) {
      return setTopologies(topologies);
    }
    try {
      const res = await fetch("/api/topology", { method: "GET" });
      const resData = await res.json();
      setTopologies(resData);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  }, [setTopologies, topologies]);

  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchWeathermap();
    hasMountedRef.current = true;
  }, [fetchWeathermap]);

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
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <h1 className="text-lg font-bold">Weathermap</h1>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Link
              href={"/create/weathermap"}
              className="flex flex-row items-center gap-1 p-2 bg-[#3b3b3b] rounded-sm text-[#ebeaea] font-lexend text-xs transition-all hover:bg-[#525151] duration-200"
            >
              <Plus className="shrink-0 w-4 h-4" /> Create Weathermap
            </Link>
            <Link
              href={"/settings/weathermap"}
              className="flex flex-row items-center gap-1 p-2 bg-[#3b3b3b] rounded-sm text-[#ebeaea] font-lexend text-sm transition-all hover:bg-[#525151] duration-200"
            >
              <Settings className="shrink-0 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <OverviewWeathermapTable
        topologies={topologies}
        setTopologies={setTopologies}
      />
    </div>
  );
}
