"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
import { tripleEncode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SystemDevicesSettings() {
  const router = useRouter();
  const [discoverIP, setDescoverIP] = useState<string>("");
  const [discoverInt, setDiscoverInt] = useState<string>("");
  const [discoverCommunity, setDescoverCommunity] =
    useState<string>("SNMP-BB_RO");
  const [discoveredDevice, setDiscoveredDevice] = useState<DeviceInfoTypes[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<DeviceInfoTypes[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceTypes[]>([]);
  // Fetch the new device or router
  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/snmp/discovery`, {
        method: "POST",
        body: JSON.stringify({ discoverIP, discoverCommunity }),
      });
      const resData = await res.json();
      setDiscoveredDevice((prev) => [...prev, resData]);
      setLoading(false);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
      setLoading(false);
    }
  };
  const fetchDevice = async () => {
    try {
      const res = await fetch(`/api/snmp/explorer?oid=1.3.6.1.2.1.47`, {
        method: "GET",
      });
      const resData = await res.json();
      console.log(resData);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const fetchCPU = async () => {
    try {
      const res = await fetch(`/api/snmp/cpu`, { method: "GET" });
      const resData = await res.json();
      console.log(resData);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const handleSubmitDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/snmp/device", {
        method: "POST",
        body: JSON.stringify(discoveredDevice),
      });
      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        toast.error(resData.message);
        return;
      }
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const handleSubmitInterfaces = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = tripleEncode("2");
      const res = await fetch("/api/snmp/interfaces", {
        method: "POST",
        body: JSON.stringify({ interfaces, type }),
      });
      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        toast.error(resData.message);
        return;
      }
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const fetchDevices = async () => {
    try {
      const val = tripleEncode("all");
      const res = await fetch(`/api/snmp/device?id=${val}`, {
        method: "GET",
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      toast.success(resData.message);
      setDevices(resData.data);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const fetchInterfaces = async () => {
    try {
      const type = tripleEncode("1");
      const disInt = tripleEncode(discoverInt);
      const disCom = tripleEncode(discoverCommunity);
      const res = await fetch("/api/snmp/interfaces", {
        method: "POST",
        body: JSON.stringify({
          host: disInt,
          community: disCom,
          type,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      setInterfaces(resData);
      toast.success("Loaded interfaces successfully");
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-600">Up</Badge>;
      case 2:
        return <Badge variant="destructive">Down</Badge>;
      case 3:
        return <Badge variant="secondary">Testing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  return (
    <div>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Devices",
              href: "/system/devices",
            },
            {
              label: "Device Settings",
            },
          ]}
        />

        <h1 className="text-2xl font-bold">Device Settings</h1>
      </div>
      <div className="flex items-end gap-3 py-5">
        <div className="flex flex-col gap-3">
          <Label>IP Address</Label>
          <Input
            type="text"
            value={discoverIP}
            onChange={(e) => setDescoverIP(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Community</Label>
          <Input
            type="text"
            value={discoverCommunity}
            onChange={(e) => setDescoverCommunity(e.target.value)}
          />
        </div>
        <Button onClick={() => fetchDiscovery()}>
          {loading ? "Discovering..." : "Discover"}
        </Button>
      </div>

      <button onClick={() => fetchDevice()}>Device</button>
      <button onClick={() => fetchCPU()}>CPU</button>
      <div className="w-full rounded-lg border bg-white dark:bg-zinc-900">
        <form onSubmit={handleSubmitDevices}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Poll Time</TableHead>
                <TableHead>Current (ms)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Object ID</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {discoveredDevice.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No discoveredDevice discovered.
                  </TableCell>
                </TableRow>
              ) : (
                discoveredDevice.map((device, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {device.sysName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.ipAddress}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.community}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.uptime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.pollTime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.currentMs}
                    </TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap wrap-break-word">
                      {device.sysDescr}
                    </TableCell>

                    <TableCell>{device.sysContact}</TableCell>

                    <TableCell>{device.sysLocation}</TableCell>

                    <TableCell className="font-mono text-sm">
                      {device.sysObjectID}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Button type="submit">Save</Button>
        </form>
      </div>

      <Button onClick={() => fetchDevices()}>Check Existing Device</Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>System Name</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Community</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Poll Time</TableHead>
            <TableHead>Current (ms)</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Object ID</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-6 text-muted-foreground"
              >
                No devices discovered.
              </TableCell>
            </TableRow>
          ) : (
            devices.map((device, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{device.sysName}</TableCell>
                <TableCell className="font-medium">
                  {device.ipAddress}
                </TableCell>
                <TableCell className="font-medium">
                  {device.community}
                </TableCell>
                <TableCell className="font-medium">{device.uptime}</TableCell>
                <TableCell className="font-medium">{device.pollTime}</TableCell>
                <TableCell className="font-medium">
                  {device.currentMs}
                </TableCell>

                <TableCell className="max-w-md whitespace-pre-wrap wrap-break-word">
                  {device.sysDescr}
                </TableCell>

                <TableCell>{device.sysContact}</TableCell>

                <TableCell>{device.sysLocation}</TableCell>

                <TableCell className="font-mono text-sm">
                  {device.sysObjectID}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-end gap-3 py-5">
        <div className="flex flex-col gap-3">
          <Label>IP Address</Label>
          <Input
            type="text"
            value={discoverInt}
            onChange={(e) => setDiscoverInt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Community</Label>
          <Input
            type="text"
            value={discoverCommunity}
            onChange={(e) => setDescoverCommunity(e.target.value)}
          />
        </div>
        <Button onClick={() => fetchInterfaces()}>
          {loading ? "Fetching..." : "Fetch Interfaces"}
        </Button>
      </div>
      <form onSubmit={handleSubmitInterfaces}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Interface</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Admin Status</TableHead>
              <TableHead>Oper Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {interfaces.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No interfaces found.
                </TableCell>
              </TableRow>
            ) : (
              interfaces.map((item) => (
                <TableRow key={item.index}>
                  <TableCell className="font-medium">{item.index}</TableCell>

                  <TableCell>{item.name}</TableCell>

                  <TableCell className="max-w-xs">
                    <div className="truncate">{item.description || "-"}</div>
                  </TableCell>

                  <TableCell>{item.speedMbps.toLocaleString()} Mbps</TableCell>

                  <TableCell>{getStatusBadge(item.adminStatus)}</TableCell>

                  <TableCell>{getStatusBadge(item.operStatus)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
