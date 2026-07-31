"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/context/DataContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function WeatherMap() {
  const { devices } = useData();
  const hasMountedRef = useRef<boolean>(false);

  const handleSubmitDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/snmp/device", {
        method: "POST",
        body: JSON.stringify(devices),
      });
      const resData = await res.json();
      if (!res.ok) {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Weathermap</h1>
      <form
        onSubmit={handleSubmitDevices}
        className="rounded-lg border bg-white dark:bg-zinc-900"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System Name</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Poll Time</TableHead>
              <TableHead>Current (ms)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell className="font-medium">
                    {device.sysName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {device.ipAddress}
                  </TableCell>
                  <TableCell className="font-medium">{device.uptime}</TableCell>
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
                  <TableCell className="text-center">
                    <div
                      className={`rounded text-white p-2 font-lexend ${device.status === "1" ? "bg-green-400" : "bg-red-400"}`}
                    >
                      {device.status === "1" ? "Online" : "Offline"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </form>
    </div>
  );
}
