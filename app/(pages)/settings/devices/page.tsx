"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
import { tripleEncode } from "@/lib/utils";
import {
  Activity,
  Loader2,
  Network,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  Terminal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const RETENTION_OPTIONS = [
  {
    value: "1",
    label: "30 Days",
  },
  {
    value: "2",
    label: "2 Months",
  },
  {
    value: "3",
    label: "3 Months",
  },
  {
    value: "6",
    label: "6 Months",
  },
  {
    value: "12",
    label: "12 Months",
  },
];
export default function SystemDevicesSettings() {
  const router = useRouter();
  const [discoverIP, setDescoverIP] = useState<string>("");
  const [discoverInt, setDiscoverInt] = useState<string>("");
  const [discoverCommunity, setDescoverCommunity] =
    useState<string>("SNMP-BB_RO");
  const [discoveredDevice, setDiscoveredDevice] = useState<DeviceInfoTypes[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<DeviceInfoTypes[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceTypes[]>([]);
  // Fetch the new device or router
  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/snmp/discovery`, {
        method: "POST",
        body: JSON.stringify({ discoverIP, discoverCommunity }),
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
      setDiscoveredDevice((prev) => [...prev, resData]);
      setLoading(false);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
      setLoading(false);
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
        body: JSON.stringify(discoveredDevice),
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
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const handleSubmitInterfaces = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = tripleEncode("2");
      const res = await fetch("/api/snmp/interfaces", {
        method: "POST",
        body: JSON.stringify({ interfaces, type }),
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
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const fetchDevices = async () => {
    try {
      const val = tripleEncode("all");
      const res = await fetch(`/api/snmp/device?id=${val}`, {
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
      toast.success(resData.message);
      setDevices(resData.devices);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  const fetchInterfaces = async () => {
    try {
      const type = tripleEncode("1");
      const disInt = tripleEncode(discoverInt);
      const disCom = tripleEncode(discoverCommunity);
      const res = await fetch("/api/snmp/interfaces", {
        method: "POST",
        body: JSON.stringify({
          host: disInt,
          community: disCom,
          type,
        }),
      });
      const resData = await res.json();
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      setInterfaces(resData);
      toast.success("Loaded interfaces successfully");
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
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

  const [months, setMonths] = useState("2");

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await fetch("/api/snmp/traffic/retention");

        const data = await res.json();
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        if (res.ok) {
          setMonths(String(data.months));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSetting();
  }, [router, setLoading]);

  const handleChange = async (value: string) => {
    const previousValue = months;

    setMonths(value);

    try {
      const res = await fetch("/api/snmp/traffic/retention", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          months: Number(value),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMonths(previousValue);

        toast.error(data.message || "Failed to update retention.");

        return;
      }

      toast.success("Traffic data retention updated.");
    } catch {
      setMonths(previousValue);

      toast.error("Failed to update retention.");
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-12 w-full max-w-full overflow-x-hidden font-lexend">
      {/* ============ PAGE HEADER & BREADCRUMBS ============ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Devices", href: "/system/devices" },
              { label: "Device Settings" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Device Settings & Discovery
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage SNMP settings, discover new network hardware, and configure
              retention.
            </p>
          </div>
        </div>

        {/* Debug/Diagnostic Tools - Tucked neatly to the side */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDevice()}
            className="h-8 gap-2 hidden lg:flex"
          >
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            Raw Device Fetch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCPU()}
            className="h-8 gap-2 hidden lg:flex"
          >
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            Check CPU
          </Button>
        </div>
      </div>

      {/* ============ CARD 1: DEVICE DISCOVERY ============ */}
      <section className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Server className="h-4 w-4 text-primary" />
            <h3>Discover New Device</h3>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Discovery Form */}
          <div className="flex flex-col sm:flex-row items-end gap-4 rounded-lg bg-muted/30 p-4 border border-dashed">
            <div className="flex flex-col gap-1.5 w-full sm:w-64">
              <Label
                htmlFor="discover-ip"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Target IP Address
              </Label>
              <Input
                id="discover-ip"
                type="text"
                placeholder="e.g. 192.168.1.1"
                className="h-9 bg-background"
                value={discoverIP}
                onChange={(e) => setDescoverIP(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-64">
              <Label
                htmlFor="discover-comm"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                SNMP Community
              </Label>
              <Input
                id="discover-comm"
                type="text"
                placeholder="public"
                className="h-9 bg-background"
                value={discoverCommunity}
                onChange={(e) => setDescoverCommunity(e.target.value)}
              />
            </div>
            <Button
              onClick={() => fetchDiscovery()}
              disabled={loading}
              className="h-9 w-full sm:w-auto shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Discover Device
            </Button>
          </div>

          {/* Results Table */}
          <form
            onSubmit={handleSubmitDevices}
            className="rounded-lg border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      System Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      IP Address
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Community
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Uptime</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Poll Time
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      Current
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Contact</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Location
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Object ID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discoveredDevice.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No devices discovered yet. Run a discovery above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discoveredDevice.map((dev, index) => (
                      <TableRow key={index} className="hover:bg-muted/40">
                        <TableCell className="font-medium whitespace-nowrap">
                          {dev.sysName || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {dev.ipAddress}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            {dev.community}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {dev.uptime || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {dev.pollTime || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums font-mono text-xs">
                          {dev.currentMs != null ? `${dev.currentMs}ms` : "—"}
                        </TableCell>
                        <TableCell className="max-w-50">
                          <div
                            className="truncate text-sm text-muted-foreground"
                            title={dev.sysDescr}
                          >
                            {dev.sysDescr || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {dev.sysContact || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {dev.sysLocation || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {dev.sysObjectID || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Form Action Footer */}
            {discoveredDevice.length > 0 && (
              <div className="flex justify-end p-3 border-t bg-muted/10">
                <Button type="submit" size="sm" className="gap-2">
                  <Save className="h-4 w-4" /> Save Discovered Devices
                </Button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ============ CARD 2: INTERFACE DISCOVERY ============ */}
      <section className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Network className="h-4 w-4 text-primary" />
            <h3>Discover Interfaces</h3>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Discovery Form */}
          <div className="flex flex-col sm:flex-row items-end gap-4 rounded-lg bg-muted/30 p-4 border border-dashed">
            <div className="flex flex-col gap-1.5 w-full sm:w-64">
              <Label
                htmlFor="int-ip"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                Device IP Address
              </Label>
              <Input
                id="int-ip"
                type="text"
                placeholder="e.g. 192.168.1.1"
                className="h-9 bg-background"
                value={discoverInt}
                onChange={(e) => setDiscoverInt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-64">
              <Label
                htmlFor="int-comm"
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                SNMP Community
              </Label>
              <Input
                id="int-comm"
                type="text"
                placeholder="public"
                className="h-9 bg-background"
                value={discoverCommunity}
                onChange={(e) => setDescoverCommunity(e.target.value)}
              />
            </div>
            <Button
              onClick={() => fetchInterfaces()}
              disabled={loading}
              className="h-9 w-full sm:w-auto shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Fetch Interfaces
            </Button>
          </div>

          {/* Results Table */}
          <form
            onSubmit={handleSubmitInterfaces}
            className="rounded-lg border overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Interface</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Speed</TableHead>
                    <TableHead>Admin Status</TableHead>
                    <TableHead>Oper Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interfaces.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No interfaces discovered yet. Run a fetch above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    interfaces.map((item) => (
                      <TableRow key={item.index} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {item.index}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {item.name}
                        </TableCell>
                        <TableCell className="max-w-62.5">
                          <div
                            className="truncate text-sm text-muted-foreground"
                            title={item.description}
                          >
                            {item.description || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums font-mono text-xs">
                          {item.speedMbps?.toLocaleString() ?? 0}{" "}
                          <span className="text-muted-foreground font-sans">
                            Mbps
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.adminStatus)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.operStatus)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Form Action Footer */}
            {interfaces.length > 0 && (
              <div className="flex justify-end p-3 border-t bg-muted/10">
                <Button type="submit" size="sm" className="gap-2">
                  <Save className="h-4 w-4" /> Save Interfaces
                </Button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ============ CARD 3: EXISTING DEVICES ============ */}
      <section className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h3>Currently Managed Devices</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDevices()}
            className="h-8 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload List
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="whitespace-nowrap">System Name</TableHead>
                <TableHead className="whitespace-nowrap">IP Address</TableHead>
                <TableHead className="whitespace-nowrap">Community</TableHead>
                <TableHead className="whitespace-nowrap">Uptime</TableHead>
                <TableHead className="whitespace-nowrap">Poll Time</TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  Current
                </TableHead>
                <TableHead className="whitespace-nowrap">Description</TableHead>
                <TableHead className="whitespace-nowrap">Contact</TableHead>
                <TableHead className="whitespace-nowrap">Location</TableHead>
                <TableHead className="whitespace-nowrap">Object ID</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Server className="h-6 w-6 opacity-20" />
                      <p>No managed devices found in database.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((dev, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {dev.sysName || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {dev.ipAddress}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {dev.community}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dev.uptime || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dev.pollTime || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {dev.currentMs != null ? `${dev.currentMs}ms` : "—"}
                    </TableCell>
                    <TableCell className="max-w-50">
                      <div
                        className="truncate text-sm text-muted-foreground"
                        title={dev.sysDescr}
                      >
                        {dev.sysDescr || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dev.sysContact || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dev.sysLocation || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {dev.sysObjectID || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ============ CARD 4: GLOBAL SETTINGS ============ */}
      <section className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Settings className="h-4 w-4 text-primary" />
            <h3>Global System Settings</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 max-w-2xl">
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-foreground">
                Traffic Data Retention
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose how long NetVision keeps interface traffic statistics.
                Data older than this period will be automatically pruned to save
                database space.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-56">
              <Select
                value={months}
                onValueChange={(e) => handleChange(e as string)}
                disabled={loading}
              >
                <SelectTrigger className="w-full bg-background h-10">
                  <SelectValue placeholder="Select retention" />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
