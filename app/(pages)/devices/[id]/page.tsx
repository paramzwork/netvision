"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useDeviceStore } from "@/store/device-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrafficChart } from "@/components/trafficchart";
import { DeviceTable } from "@/components/table/devicetable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { tripleEncode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InterfaceResponse, InterfaceTraffic } from "@/lib/types";
export default function ViewDevice() {
  const params = useParams();
  const raw = decodeURIComponent(params.id as string);
  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const [inOutTraffic, setInOutTraffic] = useState<InterfaceTraffic[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);

  const { devices, selectedDevice, setDevice, setSelectedDevice } =
    useDeviceStore();
  const fetchDevice = useCallback(async () => {
    if (devices[raw]) {
      setSelectedDevice(devices[raw]);
      return;
    }
    try {
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
      // Cache the device
      setDevice(raw, resData);

      // Set the active device
      setSelectedDevice(resData);

      // setDevice(resData);
      toast.success("Device loaded successfully!");
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  }, [devices, raw, router, setDevice, setSelectedDevice]);

  const fetchTraffic = async () => {
    if (!selectedDevice) {
      toast.error("Community is missing.");
      return;
    }
    try {
      const community = tripleEncode(selectedDevice.community);
      const res = await fetch("/api/snmp/interfaces", {
        method: "POST",
        body: JSON.stringify({ raw, community }),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error("Missing host.");
        return;
      }
      setInOutTraffic(resData);
      toast.success("Loaded traffic successfully!");
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const saveTraffic = async () => {
    try {
      const res = await fetch("/api/snmp/traffic", {
        method: "POST",
        body: JSON.stringify({ inOutTraffic }),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error("Missing host.");
        return;
      }
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };

  const fetchInterfaces = async () => {
    if (!selectedDevice) return;
    try {
      const raw = tripleEncode(selectedDevice.ipAddress);
      const res = await fetch(`/api/snmp/traffic?id=${raw}`, { method: "GET" });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setInterfaces(data.interfaces);
    } catch {
      toast.error("Internal Server Error");
    }
  };
  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();

    hasMountedRef.current = true;
  }, [fetchDevice]);
  console.log(interfaces)
  return (
    <div className="space-y-6">
      <Button onClick={() => fetchTraffic()}>Fetch Traffic</Button>
      <Button onClick={() => saveTraffic()}>Save</Button>
      <Button onClick={() => fetchInterfaces()}>Fetch Interface</Button>
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Devices",
            },
          ]}
        />
        <h1 className="text-2xl font-bold">Device {selectedDevice?.sysName}</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>System Name</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Poll Time</TableHead>
            <TableHead>Current (ms)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {selectedDevice === null ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-6 text-muted-foreground"
              >
                No devices discovered.
              </TableCell>
            </TableRow>
          ) : (
            <TableRow className="odd:bg-gray-300">
              <TableCell className="font-medium">
                {selectedDevice.sysName}
              </TableCell>
              <TableCell className="font-medium">
                {selectedDevice.ipAddress}
              </TableCell>
              <TableCell className="font-medium">
                {selectedDevice.uptime}
              </TableCell>
              <TableCell className="font-medium">
                {selectedDevice.pollTime}
              </TableCell>
              <TableCell className="font-medium">
                {selectedDevice.currentMs}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Network Overview</h1>
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedDevice?.sysName}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafficChart interfaces={interfaces} />
          </CardContent>
        </Card>
        <DeviceTable interfaces={interfaces} />
      </div>
    </div>
  );
}
