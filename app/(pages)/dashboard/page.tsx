"use client";
import { StatCard } from "@/components/statcard";
import { TrafficChart } from "@/components/trafficchart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cactiFetch } from "@/lib/cacti";

export default function DashboardPage() {
  const fetchMgmt = async () => {
    const res = await cactiFetch(
      "http://10.0.3.161/cacti/host.php?action=edit&id=1",
    );

    console.log("Status:", res.status);
    console.log("Location:", res.headers.get("location"));

    const html = await res.text();

    console.log(html.substring(0, 500));
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
          <CardTitle>Traffic (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrafficChart />
        </CardContent>
      </Card>
      <button onClick={() => fetchMgmt}>Manangement</button>
    </div>
  );
}
