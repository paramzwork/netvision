"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings } from "lucide-react";
import Link from "next/link";
import { tripleEncode } from "@/lib/utils";
import { useDevicesStore, useInterfaceStore } from "@/store/device-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import WeatherMapComponent from "@/components/WeatherMapComponent";

export default function WeatherMapSettings() {
  const { device, setDevice } = useDevicesStore();
  const { interfaces, setInterfaces } = useInterfaceStore();
  const { getInterfaces } = useInterfaceStore();
  const [fetchSelectedDev, setFetchSelectedDev] = useState<string>("");
  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const fetchDevice = useCallback(async () => {
    if (device.length > 0) {
      setDevice(device);
      return;
    }
    try {
      const raw = tripleEncode("all");
      const res = await fetch(`/api/snmp/device?id=${raw}`, { method: "GET" });
      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        toast.error(resData.message);
        return;
      }
      setDevice(resData.data);
      toast.success("Devices loaded successfully!");
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  }, [device, router, setDevice]);

  const fetchInterfaces = useCallback(async () => {
    if (!fetchSelectedDev) return;

    const { interfaces } = useInterfaceStore.getState();

    if (interfaces[fetchSelectedDev]) {
      return;
    }
    try {
      const raw = tripleEncode(fetchSelectedDev);

      const res = await fetch(`/api/snmp/traffic?id=${raw}`);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setInterfaces(fetchSelectedDev, data.interfaces);
    } catch {
      toast.error("Internal Server Error");
    }
  }, [fetchSelectedDev, setInterfaces]);

  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();

    hasMountedRef.current = true;
  }, [fetchDevice]);

  useEffect(() => {
    if (!fetchSelectedDev) return;

    if (interfaces[fetchSelectedDev]) return;

    fetchInterfaces();
  }, [fetchSelectedDev, fetchInterfaces, interfaces]);
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
  const updateInterfaceStatus = async (id: number, status: "1" | "0") => {
    try {
      const res = await fetch("/api/snmp/interfaces", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        toast.error("Failed to update status.");
        return;
      }

      setInterfaces(fetchSelectedDev, (prev) =>
        prev.map((iface) => (iface.id === id ? { ...iface, status } : iface)),
      );

      toast.success("Status updated.");
    } catch {
      toast.error("Internal Server Error.");
    }
  };
  const deviceInterfaces = getInterfaces(fetchSelectedDev);
  const filteredData = deviceInterfaces.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.name.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.index.toString().includes(keyword)
    );
  });
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
              href: "/weathermap",
            },
            {
              label: "Weathermap Settings",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">Weathermap Settings</h1>
          <Link href={"/weathermap/settings"}>
            <Settings className="shrink-0 w-5 h-5" />
          </Link>
        </div>
      </div>
      <Table className="border">
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
          {device.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-6 text-muted-foreground"
              >
                No devices discovered.
              </TableCell>
            </TableRow>
          ) : (
            device.map((device, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div
                    className="hover:underline cursor-pointer"
                    onClick={() => setFetchSelectedDev(device.ipAddress)}
                  >
                    {device.sysName}
                  </div>
                </TableCell>
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
      <Input
        className="w-100"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-115 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Interface</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Admin Status</TableHead>
              <TableHead>Oper Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No interfaces found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.index} className="hover:bg-gray-300">
                  <TableCell>
                    <Checkbox
                      checked={item.status === "1"}
                      onCheckedChange={(checked) => {
                        updateInterfaceStatus(
                          item.id,
                          checked === true ? "1" : "0",
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.id}</TableCell>

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
      </div>
      <div className="w-full h-175">
        <WeatherMapComponent />
      </div>
    </div>
  );
}
