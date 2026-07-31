"use client";

import { StatCard } from "@/components/statcard";
import { TrafficChart } from "@/components/trafficchart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SnmpData } from "@/lib/types";
import { useState } from "react";
import { DeviceTable } from "@/components/table/devicetable";

export default function DevicesPage() {
  const [data, setData] = useState<SnmpData>({
    hostname: "",
    description: "",
    uptime: "",
    contact: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testSNMP = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/snmp");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "SNMP request failed");
      }

      setData(json.data);
      console.log(json.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Network Overview</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Traffic"
          value="1.2 TB"
          change="+12% from yesterday"
        />
        <StatCard title="Active Devices" value="2" change="+0 new devices" />
        <StatCard title="Avg Latency" value="23ms" change="-2ms improvement" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>CPN-1-RC</CardTitle>
        </CardHeader>
        <CardContent>
          <TrafficChart />
        </CardContent>
      </Card>
      <DeviceTable />
    </div>
  );
}
