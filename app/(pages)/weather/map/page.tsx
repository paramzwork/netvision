"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceInfoTypes } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export default function WeatherMap() {
  const [descoverIP, setDescoverIP] = useState<string>("");
  const [devices, setDevices] = useState<DeviceInfoTypes[]>([]);
  const fetchDescovery = async () => {
    try {
      const res = await fetch(`/api/snmp/descovery`, {
        method: "POST",
        body: JSON.stringify({ descoverIP }),
      });
      const resData = await res.json();
      setDevices((prev) => [...prev, resData]);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
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

      <h1 className="text-2xl font-bold">Network Overview</h1>
      <input
        type="text"
        className="border"
        value={descoverIP}
        onChange={(e) => setDescoverIP(e.target.value)}
      />
      <button onClick={() => fetchDescovery()}>Descover</button>
      <button onClick={() => fetchDevice()}>Device</button>
      <button onClick={() => fetchCPU()}>CPU</button>
      <form
        onSubmit={handleSubmitDevices}
        className="rounded-lg border bg-white dark:bg-zinc-900"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System Name</TableHead>
              <TableHead>IP Address</TableHead>
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
                  <TableCell className="font-medium">
                    {device.sysName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {device.ipAddress}
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
      </form>
      <button type="submit">Save</button>
    </div>
  );
}
