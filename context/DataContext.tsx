"use client";
import { CactiDevice, ConsumptionGroupedByClient } from "@/lib/types";
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
  consumptionGroupData: ConsumptionGroupedByClient[];
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  cactiKill: string;
  setCactiKill: React.Dispatch<React.SetStateAction<string>>;
  setConsumptionGroupData: React.Dispatch<
    React.SetStateAction<ConsumptionGroupedByClient[]>
  >;
  cactiDevice: CactiDevice[];
  setCactiDevice: React.Dispatch<React.SetStateAction<CactiDevice[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [consumptionGroupData, setConsumptionGroupData] = useState<
    ConsumptionGroupedByClient[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cactiKill, setCactiKill] = useState<string>("");
  const [cactiDevice, setCactiDevice] = useState<CactiDevice[]>([]);
  const hasMountedRef = useRef<boolean>(false);
  const fetchDevice = useCallback(async () => {
    try {
      const res = await fetch("/api/cacti/host", { method: "POST" });

      if (!res.ok) {
        throw new Error("Failed to fetch devices");
      }

      const data: CactiDevice[] = await res.json();
      setCactiDevice(data);
    } catch (error) {
      console.error(error);

      toast.error("Failed to fetch data.", {
        description: "Cacti devices are not available.",
      });
    }
  }, []);
  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();
    hasMountedRef.current = true;
  }, [fetchDevice]);
  return (
    <DataContext.Provider
      value={{
        consumptionGroupData,
        isLoading,
        setIsLoading,
        cactiKill,
        setCactiKill,
        setConsumptionGroupData,
        cactiDevice,
        setCactiDevice,
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
