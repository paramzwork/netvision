import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GraphType, InterfaceResponse } from "./types";
import { ElementType } from "react";
import {
  AreaChart,
  LayoutGrid,
  LineChart,
  Percent,
  Share2,
} from "lucide-react";

export const oneEncode = (value: string): string => {
  return btoa(value);
};
export const tripleEncode = (value: string): string => {
  return btoa(btoa(btoa(value)));
};
export const oneDecode = (value: string): string => {
  return atob(value);
};
export const tripleDecode = (value: string): string => {
  return atob(atob(atob(value)));
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function counter64ToNumber(value: Buffer | number): number {
  if (typeof value === "number") {
    return value;
  }

  let result = 0;

  for (const byte of value) {
    result = result * 256 + byte;
  }

  return result;
}
export function counter64ToBigInt(value: Buffer | number): bigint {
  if (typeof value === "number") {
    return BigInt(value);
  }

  let result = 0n;

  for (const byte of value) {
    result = (result << 8n) + BigInt(byte);
  }

  return result;
}

export function formatUptime(ticks: number) {
  const seconds = Math.floor(ticks / 100);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}
/* ============================= */
/* GRAPH TYPE SIDEBAR */
/* ============================= */

export const GRAPH_TYPES: {
  key: GraphType;
  label: string;
  icon: ElementType;
}[] = [
  { key: "stacked", label: "Stacked", icon: AreaChart },
  { key: "percent", label: "100%", icon: Percent },
  { key: "lines", label: "Lines", icon: LineChart },
  { key: "grid", label: "Grid", icon: LayoutGrid },
  { key: "sankey", label: "Sankey", icon: Share2 },
];

export const CHART_COLORS = [
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#34d399", // emerald
  "#fbbf24", // amber
  "#f87171", // red
  "#a78bfa", // violet
  "#22d3ee", // cyan
  "#fb923c", // orange
  "#4ade80", // green
  "#94a3b8", // slate
];
export function getInterfaceStats(iface: InterfaceResponse) {
  const samples = getTrafficSamples(iface);

  const inbound = samples.map((s) => s.inbound);
  const outbound = samples.map((s) => s.outbound);

  return {
    inbound: {
      current: inbound.at(-1) ?? 0,
      average:
        inbound.reduce((sum, value) => sum + value, 0) / (inbound.length || 1),
      max: Math.max(...inbound, 0),
      speedMbps: iface.speedMbps,
    },

    outbound: {
      current: outbound.at(-1) ?? 0,
      average:
        outbound.reduce((sum, value) => sum + value, 0) /
        (outbound.length || 1),
      max: Math.max(...outbound, 0),
      speedMbps: iface.speedMbps,
    },
  };
}

export function getTrafficSamples(iface: InterfaceResponse) {
  return iface.statistics.slice(1).map((current, index) => {
    const previous = iface.statistics[index];

    const seconds =
      (new Date(current.createdAt).getTime() -
        new Date(previous.createdAt).getTime()) /
      1000;

    const inbound =
      seconds > 0
        ? Math.max(
            ((Number(current.inOctets) - Number(previous.inOctets)) * 8) /
              seconds,
            0,
          )
        : 0;

    const outbound =
      seconds > 0
        ? Math.max(
            ((Number(current.outOctets) - Number(previous.outOctets)) * 8) /
              seconds,
            0,
          )
        : 0;

    return {
      timestamp: new Date(current.createdAt).getTime(),
      inbound, // bits/sec
      outbound, // bits/sec
    };
  });
}

export function formatBandwidth(bitsPerSecond: number) {
  if (bitsPerSecond >= 1_000_000_000) {
    return `${(bitsPerSecond / 1_000_000_000).toFixed(2)} Gbps`;
  }

  if (bitsPerSecond >= 1_000_000) {
    return `${(bitsPerSecond / 1_000_000).toFixed(2)} Mbps`;
  }

  if (bitsPerSecond >= 1_000) {
    return `${(bitsPerSecond / 1_000).toFixed(2)} Kbps`;
  }

  return `${bitsPerSecond.toFixed(0)} bps`;
}
