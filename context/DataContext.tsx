"use client";
import { DeviceInfoTypes } from "@/lib/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface DataContextType {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  devices: DeviceInfoTypes[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<DeviceInfoTypes[]>([]);

  const hasMountedRef = useRef<boolean>(false);
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/snmp/device", {
        method: "GET",
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      setDevices(resData.data);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  }, []);
  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevices();
    hasMountedRef.current = true;
  }, [fetchDevices]);
  return (
    <DataContext.Provider
      value={{
        isLoading,
        setIsLoading,
        devices,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }

  return context;
}
