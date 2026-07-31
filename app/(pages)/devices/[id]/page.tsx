"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
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
export default function ViewDevice() {
  const params = useParams();
  const raw = decodeURIComponent(params.id as string);
  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const { devices, selectedDevice, setDevice, setSelectedDevice } =
    useDeviceStore();
  const fetchDevice = useCallback(async () => {
    if (devices[raw]) {
      setSelectedDevice(devices[raw]);
      return;
    }
    try {
      const res = await fetch(`/api/snmp/device?id=${raw}`, { method: "POST" });
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
  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();
    hasMountedRef.current = true;
  }, [fetchDevice]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Device {selectedDevice?.sysName}</h1>
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
    </div>
  );
}
