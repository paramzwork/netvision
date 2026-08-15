"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { tripleEncode } from "@/lib/utils";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface TopologyTypes {
  id: number;
  name: string;
  description: string;
}
export default function WeatherMap() {
  const [topology, setTopology] = useState<TopologyTypes[]>([]);
  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const fetchWeathermap = async () => {
    try {
      const res = await fetch("/api/topology", { method: "GET" });
      const resData = await res.json();
      setTopology(resData);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };

  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchWeathermap();
    hasMountedRef.current = false;
  }, []);

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
      <Select
        onValueChange={(value) => {
          const id = tripleEncode(String(value));
          router.push(`/weathermap/${id}`);
        }}
      >
        <SelectTrigger
          className="h-9! w-50! text-sm"
          aria-label="Select a preset time range"
        >
        </SelectTrigger>
        <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Presets</SelectLabel>
            {topology.map((p, idx) => (
              <SelectItem key={idx} value={`${p.id}`}>
                {p.id}-{p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
