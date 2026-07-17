"use client";

import { ConsumptionGroupedByClient } from "@/lib/types";
import React, {
  createContext,
  useContext,
  useState,
} from "react";

interface DataContextType {
  consumptionGroupData: ConsumptionGroupedByClient[];
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  cactiKill: string;
  setCactiKill: React.Dispatch<React.SetStateAction<string>>;
  setConsumptionGroupData: React.Dispatch<
    React.SetStateAction<ConsumptionGroupedByClient[]>
  >;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [consumptionGroupData, setConsumptionGroupData] = useState<
    ConsumptionGroupedByClient[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cactiKill, setCactiKill] = useState<string>("");

  return (
    <DataContext.Provider
      value={{
        consumptionGroupData,
        isLoading,
        setIsLoading,
        cactiKill,
        setCactiKill,
        setConsumptionGroupData,
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
