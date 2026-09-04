import React, { useEffect, useMemo, useState } from "react";
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
import { ArrowUpDown, ChevronDown, ChevronUp, Search } from "lucide-react";
import EntriesPerPage from "../EntriesPerPage";
import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
import Pagination from "../Pagination";

export default function SettingsWeathermapTable() {
  const device = useDevicesStore((state) => state.device);
  const setDevice = useDevicesStore((state) => state.setDevice);
  const totalDevices = useDevicesStore((state) => state.total);
  const setTotalDevices = useDevicesStore((state) => state.setTotal);
  const setInterfaces = useInterfaceStore((state) => state.setInterfaces);
  const { getInterfaces } = useInterfaceStore();

  const [fetchSelectedDev, setFetchSelectedDev] = useState<string>("");
  const [pageInt, setPageInt] = useState<number>(1);
  const [limitInt, setLimitInt] = useState<string>("10");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<string>("10");
  const [search, setSearch] = useState<string>("");
  const [searchInt, setSearchInt] = useState<string>("");
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // 🔍 Filtered data
  const filteredData = useMemo(() => {
    return device.filter((item) => {
      const matchSearch = `${item.sysName} ${item.ipAddress}`
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      return matchSearch;
    });
  }, [device, search]);
  const sortData = <T,>(
    array: T[],
    key: keyof T,
    direction: "asc" | "desc",
  ): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return sortData(
      filteredData,
      sortConfig.key as keyof DeviceInfoTypes,
      sortConfig.direction,
    );
  }, [filteredData, sortConfig]);

  const paginatedData = sortedData;
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
        setTotalDevices(resData.totalDevices);
        toast.success("Devices loaded successfully!");
      } catch {
        toast.error("Internal Server Error.", {
          description: "Server error please contact admin.",
        });
      }
    };

    fetchDevice();
  }, [router, setDevice, setTotalDevices]);

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
  const filteredDataInt = deviceInterfaces.filter((item) => {
    const keyword = searchInt.toLowerCase();

    return (
      item.name.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.index.toString().includes(keyword)
    );
  });
  const sortedDataInt = useMemo(() => {
    if (!sortConfig) return filteredDataInt;

    return sortData(
      filteredDataInt,
      sortConfig.key as keyof InterfaceTypes,
      sortConfig.direction,
    );
  }, [filteredDataInt, sortConfig]);

  const paginatedDataInt = useMemo(() => {
    if (limitInt === "all") {
      return sortedDataInt;
    }

    const limit = Number(limitInt);

    const start = (pageInt - 1) * limit;
    const end = start + limit;

    return sortedDataInt.slice(start, end);
  }, [sortedDataInt, pageInt, limitInt]);
  return (
    <div className="w-full flex flex-col gap-6">
      {/* ============ DEVICE TABLE ============ */}
      <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="text-base font-semibold">Discovered Devices</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {device.length} devices found
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full h-10 pl-9 pr-4 text-xs bg-background border border-input rounded-md ring-offset-background  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-auto">
              <EntriesPerPage
                limit={limit}
                setLimit={setLimit}
                setPage={setPage}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                <TableHead
                  className="font-medium cursor-pointer select-none group hidden md:table-cell"
                  onClick={() =>
                    setSortConfig((prev) =>
                      prev?.key === "sysName" && prev.direction === "asc"
                        ? { key: "sysName", direction: "desc" }
                        : { key: "sysName", direction: "asc" },
                    )
                  }
                >
                  <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    System Name
                    {sortConfig?.key === "sysName" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </div>
                </TableHead>
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
              {paginatedData.length === 0 ? (
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
                paginatedData.map((dev, index) => (
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
        {/* BOTTOM PAGINATION */}
        <div className="p-4 border-t bg-muted/10">
          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            data={device}
            filteredData={filteredData}
            total={totalDevices}
          />
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
                value={searchInt}
                onChange={(e) => setSearchInt(e.target.value)}
                placeholder="Search interfaces..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              />
            </div>
            <div className="w-full sm:w-auto">
              <EntriesPerPage
                limit={limitInt}
                setLimit={setLimitInt}
                setPage={setPageInt}
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
                <TableHead
                  className="font-medium cursor-pointer select-none group hidden md:table-cell"
                  onClick={() =>
                    setSortConfig((prev) =>
                      prev?.key === "name" && prev.direction === "asc"
                        ? { key: "name", direction: "desc" }
                        : { key: "name", direction: "asc" },
                    )
                  }
                >
                  <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Interface
                    {sortConfig?.key === "name" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead
                  className="font-medium cursor-pointer select-none group hidden md:table-cell"
                  onClick={() =>
                    setSortConfig((prev) =>
                      prev?.key === "speedMbps" && prev.direction === "asc"
                        ? { key: "speedMbps", direction: "desc" }
                        : { key: "speedMbps", direction: "asc" },
                    )
                  }
                >
                  <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Interface
                    {sortConfig?.key === "speedMbps" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer select-none group hidden md:table-cell"
                  onClick={() =>
                    setSortConfig((prev) =>
                      prev?.key === "adminStatus" && prev.direction === "asc"
                        ? { key: "adminStatus", direction: "desc" }
                        : { key: "adminStatus", direction: "asc" },
                    )
                  }
                >
                  <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Admin Status
                    {sortConfig?.key === "adminStatus" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer select-none group hidden md:table-cell"
                  onClick={() =>
                    setSortConfig((prev) =>
                      prev?.key === "operStatus" && prev.direction === "asc"
                        ? { key: "operStatus", direction: "desc" }
                        : { key: "operStatus", direction: "asc" },
                    )
                  }
                >
                  <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Oper Status
                    {sortConfig?.key === "operStatus" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedDataInt.length === 0 ? (
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
                paginatedDataInt.map((item) => (
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
                      {item.description.length > 20 ? (
                        <TooltipComponent value={item.description}>
                          <div className="max-w-md truncate cursor-pointer text-sm">
                            {item.description.length > 20
                              ? `${item.description.slice(0, 20)}...`
                              : item.description}
                          </div>
                        </TooltipComponent>
                      ) : (
                        item.description
                      )}
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
        {/* BOTTOM PAGINATION */}
        <div className="p-4 border-t bg-muted/10">
          <Pagination
            page={pageInt}
            setPage={setPageInt}
            limit={limitInt}
            data={deviceInterfaces}
            filteredData={filteredDataInt}
            total={deviceInterfaces.length}
          />
        </div>
      </div>
    </div>
  );
}
