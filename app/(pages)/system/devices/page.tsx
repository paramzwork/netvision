"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TooltipComponent } from "@/components/TooltipComponent";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/context/DataContext";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function SystemDevices() {
  const { activeDevices } = useData();

  return (
    <div className="w-full">
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
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">Device Settings</h1>
          <Link href={"/settings/devices"}>
            <Settings className="shrink-0 w-5 h-5" />
          </Link>
        </div>
      </div>
      <div className="border rounded-sm">
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
              <TableHead>Object ID</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {activeDevices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No active devices discovered.
                </TableCell>
              </TableRow>
            ) : (
              activeDevices.map((device, index) => (
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
                    <TooltipComponent value={device.sysDescr}>
                      <TableCell>
                        <div className="max-w-md truncate cursor-pointer">
                          {device.sysDescr.length > 20
                            ? `${device.sysDescr.slice(0, 20)}...`
                            : device.sysDescr}
                        </div>
                      </TableCell>
                    </TooltipComponent>
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
      </div>
    </div>
  );
}
