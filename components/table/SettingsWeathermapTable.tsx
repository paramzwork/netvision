import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tripleEncode } from "@/lib/utils";
import { useDevicesStore, useInterfaceStore } from "@/store/device-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "../ui/checkbox";
import { TooltipComponent } from "../TooltipComponent";
import { Search } from "lucide-react";

export default function SettingsWeathermapTable() {
  const device = useDevicesStore((state) => state.device);
  const setDevice = useDevicesStore((state) => state.setDevice);
  const setInterfaces = useInterfaceStore((state) => state.setInterfaces);
  const { getInterfaces } = useInterfaceStore();
  const router = useRouter();

  const [fetchSelectedDev, setFetchSelectedDev] = useState<string>("");
  const [search, setSearch] = useState<string>("");

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

  useEffect(() => {
    const currentDevices = useDevicesStore.getState().device;

    if (currentDevices.length > 0) {
      return;
    }

    const fetchDevice = async () => {
      try {
        const raw = tripleEncode("all");

        const res = await fetch(`/api/snmp/device?id=${raw}`, {
          method: "GET",
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

        setDevice(resData.devices);

        toast.success("Devices loaded successfully!");
      } catch {
        toast.error("Internal Server Error.", {
          description: "Server error please contact admin.",
        });
      }
    };

    fetchDevice();
  }, [router, setDevice]);

  useEffect(() => {
    if (!fetchSelectedDev) return;

    const existingInterfaces =
      useInterfaceStore.getState().interfaces[fetchSelectedDev];

    if (existingInterfaces) {
      return;
    }

    const fetchData = async () => {
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
    };

    fetchData();
  }, [fetchSelectedDev, setInterfaces]);

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
    <div className="w-full flex flex-col gap-6">
      {/* ============ DEVICE TABLE ============ */}
      <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="text-base font-semibold">Discovered Devices</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {device.length} devices found
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                <TableHead className="font-medium">System Name</TableHead>
                <TableHead className="font-medium">IP Address</TableHead>
                <TableHead className="font-medium">Community</TableHead>
                <TableHead className="font-medium">Uptime</TableHead>
                <TableHead className="font-medium">Poll Time</TableHead>
                <TableHead className="font-medium">Current (ms)</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Contact</TableHead>
                <TableHead className="font-medium">Location</TableHead>
                <TableHead className="font-medium">Object ID</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {device.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 opacity-20" />
                      <p>No devices discovered.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                device.map((dev, index) => (
                  <TableRow
                    key={index}
                    className="group hover:bg-muted/30 transition-colors cursor-default"
                  >
                    <TableCell>
                      <span
                        className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setFetchSelectedDev(dev.ipAddress)}
                      >
                        {dev.sysName}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {dev.ipAddress}
                    </TableCell>
                    <TableCell className="text-sm">{dev.community}</TableCell>
                    <TableCell className="text-sm">{dev.uptime}</TableCell>
                    <TableCell className="text-sm">{dev.pollTime}</TableCell>
                    <TableCell className="text-sm">{dev.currentMs}</TableCell>
                    <TableCell className="max-w-md">
                      <TooltipComponent value={dev.sysDescr}>
                        <div className="max-w-md truncate cursor-pointer text-sm">
                          {dev.sysDescr.length > 20
                            ? `${dev.sysDescr.slice(0, 20)}...`
                            : dev.sysDescr}
                        </div>
                      </TooltipComponent>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <TooltipComponent value={dev.sysContact}>
                        <div className="max-w-md truncate cursor-pointer text-sm">
                          {dev.sysContact.length > 20
                            ? `${dev.sysContact.slice(0, 20)}...`
                            : dev.sysContact}
                        </div>
                      </TooltipComponent>
                    </TableCell>
                    <TableCell className="text-sm">{dev.sysLocation}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {dev.sysObjectID}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ============ INTERFACES TABLE ============ */}
      <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
        {/* Toolbar with Search */}
        <div className="p-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Interfaces</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredData.length} of {deviceInterfaces.length} interfaces
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search interfaces..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table with Sticky Header */}
        <div className="max-h-115 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                <TableHead className="font-medium w-16">Status</TableHead>
                <TableHead className="font-medium w-16">#</TableHead>
                <TableHead className="font-medium">Interface</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Speed</TableHead>
                <TableHead className="font-medium">Admin Status</TableHead>
                <TableHead className="font-medium">Oper Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 opacity-20" />
                      <p>No interfaces found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow
                    key={item.index}
                    className="group hover:bg-muted/30 transition-colors cursor-default"
                  >
                    <TableCell>
                      <Checkbox
                        checked={item.status === "1"}
                        onCheckedChange={(checked) => {
                          updateInterfaceStatus(
                            item.id,
                            checked === true ? "1" : "0",
                          );
                        }}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.id}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {item.name}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <TooltipComponent value={item.description}>
                        <div className="max-w-md truncate cursor-pointer text-sm">
                          {item.description.length > 20
                            ? `${item.description.slice(0, 20)}...`
                            : item.description}
                        </div>
                      </TooltipComponent>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.speedMbps.toLocaleString()}{" "}
                      <span className="text-muted-foreground text-xs">
                        Mbps
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.adminStatus)}</TableCell>
                    <TableCell>{getStatusBadge(item.operStatus)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
