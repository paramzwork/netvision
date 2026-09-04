"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import EntriesPerPage from "@/components/EntriesPerPage";
import Pagination from "@/components/Pagination";
import { TooltipComponent } from "@/components/TooltipComponent";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/context/DataContext";
import { DeviceInfoTypes } from "@/lib/types";
import { tripleEncode } from "@/lib/utils";
import { useDevicesStore } from "@/store/device-store";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function SystemDevices() {
  const { currentUser } = useData();
  const device = useDevicesStore((state) => state.device);
  const totalDevices = useDevicesStore((state) => state.total);
  const setTotalDevices = useDevicesStore((state) => state.setTotal);
  const setDevice = useDevicesStore((state) => state.setDevice);

  const [selectedID, setSelectedID] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const hasFetchedDevicesRef = useRef<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<string>("10");
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const router = useRouter();

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
  useEffect(() => {
    const currentDevices = useDevicesStore.getState().device;

    if (currentDevices.length > 0) {
      return;
    }
    if (hasFetchedDevicesRef.current) return;

    hasFetchedDevicesRef.current = true;
    const fetchDevice = async () => {
      try {
        const res = await fetch("/api/snmp/device", {
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

        setDevice(resData.data);
        setTotalDevices(resData.total);
        toast.success(resData.message);
      } catch {
        hasFetchedDevicesRef.current = false;
        toast.error("Internal Server Error.", {
          description: "Server error please contact admin.",
        });
      }
    };

    fetchDevice();
  }, [router, setDevice, setTotalDevices]);

  const handleDelete = async () => {
    try {
      const toastID = toast.loading("Deleting device...");
      const id = tripleEncode(String(selectedID));

      const res = await fetch(`/api/snmp/device/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        toast.error(resData.message, { id: toastID });
        return;
      }
      setDevice((prev) => prev.filter((dev) => dev.id !== selectedID));
      setConfirmDialog(false);
      toast.success(resData.message, { id: toastID });
    } catch {
      setConfirmDialog(false);
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const confirmDelete = (id: string) => {
    setSelectedID(id);
    setConfirmDialog(true);
  };
  return (
    <div className="w-full min-w-0 space-y-5">
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
          <h1 className="text-xl font-bold">Devices</h1>
          <Link href={"/settings/devices"}>
            <Settings className="shrink-0 w-5 h-5" />
          </Link>
        </div>
      </div>
      <div className="flex flex-col w-full bg-background border rounded-xl shadow-sm overflow-hidden">
        {/* TOP TOOLBAR: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-5 border-b bg-muted/20">
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
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableHead>IP Address</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Poll Time</TableHead>
              <TableHead>Current (ms)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Object ID</TableHead>
              {currentUser.roles.role.toLowerCase() === "super admin" && (
                <TableHead className="text-center">...</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No active devices discovered.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((device, index) => (
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

                  <TableCell className="max-w-md">
                    {device.sysDescr.length > 20 ? (
                      <TooltipComponent value={device.sysDescr}>
                        <div className="max-w-md truncate cursor-pointer">
                          {device.sysDescr.length > 20
                            ? `${device.sysDescr.slice(0, 20)}...`
                            : device.sysDescr}
                        </div>
                      </TooltipComponent>
                    ) : (
                      device.sysDescr
                    )}
                  </TableCell>

                  <TableCell>{device.sysContact}</TableCell>

                  <TableCell>{device.sysLocation}</TableCell>

                  <TableCell className="font-mono text-sm">
                    {device.sysObjectID}
                  </TableCell>
                  {currentUser.roles.role.toLowerCase() === "super admin" && (
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity md:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          onClick={() => confirmDelete(device.id)}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
      <ConfirmationDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
