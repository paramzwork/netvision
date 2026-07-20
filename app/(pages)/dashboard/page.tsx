"use client";

import { StatCard } from "@/components/statcard";
import { TrafficChart } from "@/components/trafficchart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { CactiDevice, CactiGraph } from "@/lib/types";
import { oneEncode, tripleEncode } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { DeviceTable } from "@/components/table/devicetable"

export default function DashboardPage() {
  const { cactiDevice } = useData();
  const [graph, setGraph] = useState<CactiGraph | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<CactiDevice>({
    description: "",
    hostname: "",
    id: "",
    graphs: "",
    dataSources: "",
    status: "",
    inState: "",
    uptime: "",
    pollTime: "",
    currentMs: "",
    averageMs: "",
    availability: "",
  });
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);

    fetch(
      `/api/cacti/graph?local_graph_id=162&graph_start=${now - 1800}&graph_end=${now}`,
    )
      .then((r) => r.json())
      .then(setGraph);
  }, []);
  const legends = useMemo(() => {
    if (!graph) return [];

    return Object.keys(graph)
      .filter((k) => k.startsWith("legend"))
      .sort()
      .map((k) => String(graph[k]).replace(/"/g, ""));
  }, [graph]);
  const fetchDevice = async () => {
    const id = tripleEncode(selectedDevice.id);
    const type = oneEncode("device");
    try {
      const res = await fetch(`/api/cacti/host?type=${type}&id=${id}`, {
        method: "POST",
      });
      const data = await res.json();
      console.log(data);
    } catch {}
  };
  console.log(selectedDevice)
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
      <div className="w-full">
        <button className="cursor-pointer" onClick={fetchDevice}>
          View
        </button>
        <table className="w-full table border">
          <thead>
            <tr>
              <td>Device Description</td>
              <td>Hostname</td>
              <td>ID</td>
              <td>Graphs</td>
              <td>Status</td>
              <td>In State</td>
              <td>Uptime</td>
              <td>Poll Time</td>
              <td>Current (ms)</td>
              <td>Average (ms)</td>
              <td>Aviability</td>
            </tr>
          </thead>
          <tbody>
            {cactiDevice.map((item, index) => (
              <tr
                key={index}
                className="border-t"
                onClick={() => setSelectedDevice(item)}
              >
                <td> {item.description}</td>
                <td> {item.hostname}</td>
                <td> {item.id}</td>
                <td> {item.graphs}</td>
                <td> {item.status}</td>
                <td> {item.inState}</td>
                <td> {item.uptime}</td>
                <td> {item.pollTime}</td>
                <td> {item.currentMs}</td>
                <td> {item.averageMs}</td>
                <td> {item.availability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <img src={`data:image/svg+xml;base64,${graph?.image}`} alt="Graph" />

        <ul>
          {legends.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      
      <DeviceTable />
    </div>
  );
}
