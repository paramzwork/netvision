"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDeviceStore } from "@/store/device-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrafficChart } from "@/components/trafficchart";
import { DeviceTable } from "@/components/table/devicetable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { tripleEncode } from "@/lib/utils";
import { InterfaceResponse } from "@/lib/types";
export default function ViewDevice() {
  const params = useParams();
  const raw = decodeURIComponent(params.id as string);
  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
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

  const fetchInterfaces = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      const raw = tripleEncode(selectedDevice.ipAddress);
      const res = await fetch(`/api/snmp/traffic?id=${raw}`, { method: "GET" });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/");
          return;
        }

        toast.error(data.message);
        return;
      }

      setInterfaces(data.interfaces);
    } catch {
      toast.error("Internal Server Error");
    }
  }, [router, selectedDevice]);

  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();

    hasMountedRef.current = true;
  }, [fetchDevice]);
  const isFetching = useRef(false);

  useEffect(() => {
    if (!selectedDevice) return;

    console.log("Starting interface refresh interval");

    const refresh = async () => {
      if (isFetching.current) {
        console.log("Already fetching, skipping");
        return;
      }

      isFetching.current = true;

      try {
        await fetchInterfaces();
      } finally {
        isFetching.current = false;
      }
    };

    // Initial fetch
    refresh();

    // Test: every 20 seconds
    const interval = setInterval(refresh, 10 * 60 * 1000);

    return () => {
      console.log("Clearing interface refresh interval");
      clearInterval(interval);
    };
  }, [fetchInterfaces, selectedDevice]);

  return (
    <div className="space-y-5">
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
        <h1 className="text-xl font-bold">
          {selectedDevice?.sysName} - {selectedDevice?.ipAddress}
        </h1>
      </div>
      <div className="space-y-6">
        {/* Chart */}
        <Card className="rounded-md bg-white/60 shadow-sm!">
          <CardHeader>
            <CardTitle className="font-lexend font-semibold text-sm text-slate-700">
              {selectedDevice?.sysName}
            </CardTitle>
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
