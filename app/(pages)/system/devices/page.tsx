"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
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
import { tripleEncode } from "@/lib/utils";
import { useDevicesStore } from "@/store/device-store";
import { Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function SystemDevices() {
  const { currentUser } = useData();
  const device = useDevicesStore((state) => state.device);
  const setDevice = useDevicesStore((state) => state.setDevice);

  const [selectedID, setSelectedID] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const router = useRouter();
  const hasFetchedDevicesRef = useRef<boolean>(false);

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

        toast.success("Devices loaded successfully!");
      } catch {
        hasFetchedDevicesRef.current = false;
        toast.error("Internal Server Error.", {
          description: "Server error please contact admin.",
        });
      }
    };

    fetchDevice();
  }, [router, setDevice]);
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
    <div className="w-full space-y-5">
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
              {currentUser.roles.role.toLowerCase() === "super admin" && (
                <TableHead className="text-center">...</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {device.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No active devices discovered.
                </TableCell>
              </TableRow>
            ) : (
              device.map((device, index) => (
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
      </div>
      <ConfirmationDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
