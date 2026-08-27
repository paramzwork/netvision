"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
import { HandleLayout, NodeHandle } from "./WeatherMapComponent";
export interface AggregationGroup {
  id: string;
  name: string;
  interfaces: NodeHandle[];

  connectedAggregations?: {
    id: string;
    name: string;
  }[];
}
export type AggregationMode = "automatic" | "manual";
export type BlankNodeData = {
  nodeName: string;
  label: string;
  ip: string;
  description: string;
  handles: HandleLayout;

  aggregationMode: AggregationMode;
  aggregations: AggregationGroup[];
};
export type DragItem =
  | {
      type: "interface";
      data: InterfaceTypes;
    }
  | {
      type: "device";
      data: DeviceInfoTypes;
    }
  | {
      type: "blank";
      data: BlankNodeData;
    };

type DnDContextType = [
  DragItem | null,
  React.Dispatch<React.SetStateAction<DragItem | null>>,
];

const DnDContext = createContext<DnDContextType | null>(null);

export function DnDProvider({ children }: { children: ReactNode }) {
  const state = useState<DragItem | null>(null);

  return <DnDContext.Provider value={state}>{children}</DnDContext.Provider>;
}

export function useDnD() {
  const context = useContext(DnDContext);

  if (!context) {
    throw new Error("useDnD must be used inside DnDProvider");
  }

  return context;
}
