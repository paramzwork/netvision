"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

import { formatBandwidth } from "@/lib/utils";
import { InterfaceTypes } from "@/lib/types";
import React, { useMemo, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { AggregatedInterface } from "@/app/(pages)/settings/weathermap/[id]/page";

const AGGREGATED_COLORS = [
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ec4899", // pink
  "#14b8a6", // teal
  "#ef4444", // red
];

interface EdgeTrafficPanelProps {
  sourceNodeName: string;
  targetNodeName: string;
  sourceInterfaceName: string;
  targetInterfaceName: string;
  sourceInterface: InterfaceTypes | undefined;
  interfaces: InterfaceTypes[];
  aggregatedInterfaces: AggregatedInterface[];

  inbound: number;
  outbound: number;

  onClose: () => void;
  onDragStart?: (event: React.MouseEvent<HTMLDivElement>) => void;
}
type InterfaceChartData = {
  interfaceId: number;
  interfaceName: string;
  sourceNodeName: string;
  data: {
    timestamp: number;
    time: string;
    inbound: number;
    outbound: number;
  }[];
};
type InterfaceTrafficStats = {
  interfaceId: number;
  interfaceName: string;
  sourceNodeName: string;
  currentInbound: number;
  currentOutbound: number;
  averageInbound: number;
  averageOutbound: number;
  maxInbound: number;
  maxOutbound: number;
};
export default function EdgeTrafficPanel({
  sourceNodeName,
  targetNodeName,
  aggregatedInterfaces,
  sourceInterfaceName,
  targetInterfaceName,

  inbound,
  outbound,

  sourceInterface,
  interfaces,
  onDragStart,
  onClose,
}: EdgeTrafficPanelProps) {
  const [isGraphFullscreen, setIsGraphFullscreen] = useState<boolean>(false);
  const chartData = useMemo<InterfaceChartData[]>(() => {
    // ==================================================
    // AGGREGATED LINK
    // ==================================================

    if (aggregatedInterfaces.length > 0) {
      return aggregatedInterfaces
        .map((aggregated) => {
          const iface = interfaces.find(
            (item) => item.id === aggregated.interfaceId,
          );

          if (!iface?.statistics?.length) {
            return null;
          }

          const statistics = [...iface.statistics].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          if (statistics.length < 2) {
            return {
              interfaceId: iface.id,
              interfaceName: iface.name,
              sourceNodeName: aggregated.sourceNodeName ?? "",
              data: [],
            };
          }

          const data: InterfaceChartData["data"] = [];

          for (let i = 1; i < statistics.length; i++) {
            const previous = statistics[i - 1];
            const current = statistics[i];

            const previousTime = new Date(previous.createdAt).getTime();
            const currentTime = new Date(current.createdAt).getTime();

            const elapsedSeconds = (currentTime - previousTime) / 1000;

            if (elapsedSeconds <= 0) {
              continue;
            }

            const previousIn = BigInt(previous.inOctets);
            const currentIn = BigInt(current.inOctets);

            const previousOut = BigInt(previous.outOctets);
            const currentOut = BigInt(current.outOctets);

            // Counter reset
            if (currentIn < previousIn || currentOut < previousOut) {
              continue;
            }

            const inbound =
              (Number(currentIn - previousIn) * 8) / elapsedSeconds;

            const outbound =
              (Number(currentOut - previousOut) * 8) / elapsedSeconds;

            data.push({
              timestamp: currentTime,
              time: new Date(currentTime).toLocaleTimeString(),
              inbound,
              outbound,
            });
          }

          return {
            interfaceId: iface.id,
            interfaceName: iface.name,
            sourceNodeName: aggregated.sourceNodeName ?? "",
            data,
          };
        })
        .filter((item): item is InterfaceChartData => item !== null);
    }

    // ==================================================
    // NORMAL LINK
    // ==================================================

    if (!sourceInterface?.statistics?.length) {
      return [];
    }

    const statistics = [...sourceInterface.statistics].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    if (statistics.length < 2) {
      return [
        {
          interfaceId: sourceInterface.id,
          interfaceName: sourceInterface.name,
          sourceNodeName,
          data: [],
        },
      ];
    }

    const data: InterfaceChartData["data"] = [];

    for (let i = 1; i < statistics.length; i++) {
      const previous = statistics[i - 1];
      const current = statistics[i];

      const previousTime = new Date(previous.createdAt).getTime();
      const currentTime = new Date(current.createdAt).getTime();

      const elapsedSeconds = (currentTime - previousTime) / 1000;

      if (elapsedSeconds <= 0) {
        continue;
      }

      const previousIn = BigInt(previous.inOctets);
      const currentIn = BigInt(current.inOctets);

      const previousOut = BigInt(previous.outOctets);
      const currentOut = BigInt(current.outOctets);

      // Counter reset
      if (currentIn < previousIn || currentOut < previousOut) {
        continue;
      }

      const inbound = (Number(currentIn - previousIn) * 8) / elapsedSeconds;

      const outbound = (Number(currentOut - previousOut) * 8) / elapsedSeconds;

      data.push({
        timestamp: currentTime,
        time: new Date(currentTime).toLocaleTimeString(),
        inbound,
        outbound,
      });
    }

    return [
      {
        interfaceId: sourceInterface.id,
        interfaceName: sourceInterface.name,
        sourceNodeName,
        data,
      },
    ];
  }, [interfaces, sourceInterface, sourceNodeName, aggregatedInterfaces]);
  const combinedChartData = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }

    const points = new Map<number, Record<string, string | number>>();

    for (const interfaceChart of chartData) {
      for (const point of interfaceChart.data) {
        const existing = points.get(point.timestamp);

        if (existing) {
          existing[`inbound_${interfaceChart.interfaceId}`] = point.inbound;

          existing[`outbound_${interfaceChart.interfaceId}`] = point.outbound;
        } else {
          points.set(point.timestamp, {
            timestamp: point.timestamp,
            time: point.time,

            [`inbound_${interfaceChart.interfaceId}`]: point.inbound,

            [`outbound_${interfaceChart.interfaceId}`]: point.outbound,
          });
        }
      }
    }

    return Array.from(points.values()).sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp),
    );
  }, [chartData]);
  const interfaceTrafficStats = useMemo<InterfaceTrafficStats[]>(() => {
    // ==================================================
    // NORMAL LINK
    // ==================================================

    if (aggregatedInterfaces.length === 0 && sourceInterface) {
      const statistics = [...(sourceInterface.statistics ?? [])].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const samples: {
        inbound: number;
        outbound: number;
      }[] = [];

      for (let i = 1; i < statistics.length; i++) {
        const previous = statistics[i - 1];
        const current = statistics[i];

        const previousTime = new Date(previous.createdAt).getTime();
        const currentTime = new Date(current.createdAt).getTime();

        const elapsedSeconds = (currentTime - previousTime) / 1000;

        if (elapsedSeconds <= 0) {
          continue;
        }

        const previousIn = BigInt(previous.inOctets);
        const currentIn = BigInt(current.inOctets);

        const previousOut = BigInt(previous.outOctets);
        const currentOut = BigInt(current.outOctets);

        // Counter reset
        if (currentIn < previousIn || currentOut < previousOut) {
          continue;
        }

        const calculatedInbound =
          (Number(currentIn - previousIn) * 8) / elapsedSeconds;

        const calculatedOutbound =
          (Number(currentOut - previousOut) * 8) / elapsedSeconds;

        samples.push({
          inbound: calculatedInbound,
          outbound: calculatedOutbound,
        });
      }

      const inboundValues = samples.map((sample) => sample.inbound);
      const outboundValues = samples.map((sample) => sample.outbound);

      return [
        {
          interfaceId: sourceInterface.id,
          interfaceName: sourceInterface.name,
          sourceNodeName,

          // ============================================
          // LIVE CURRENT VALUE
          // ============================================

          currentInbound: inbound,
          currentOutbound: outbound,

          // ============================================
          // HISTORICAL STATISTICS
          // ============================================

          averageInbound:
            inboundValues.length > 0
              ? inboundValues.reduce((sum, value) => sum + value, 0) /
                inboundValues.length
              : 0,

          averageOutbound:
            outboundValues.length > 0
              ? outboundValues.reduce((sum, value) => sum + value, 0) /
                outboundValues.length
              : 0,

          maxInbound: inboundValues.length > 0 ? Math.max(...inboundValues) : 0,

          maxOutbound:
            outboundValues.length > 0 ? Math.max(...outboundValues) : 0,
        },
      ];
    }

    // ==================================================
    // AGGREGATED LINK
    // ==================================================

    if (aggregatedInterfaces.length > 0) {
      const interfaceList = aggregatedInterfaces
        .map((aggregated) => {
          const iface = interfaces.find(
            (iface) => iface.id === aggregated.interfaceId,
          );

          if (!iface) {
            return null;
          }

          return {
            iface,
            sourceNodeName: aggregated.sourceNodeName ?? "",
          };
        })
        .filter(
          (
            item,
          ): item is {
            iface: InterfaceTypes;
            sourceNodeName: string;
          } => item !== null,
        );

      return interfaceList.map(({ iface, sourceNodeName }) => {
        const statistics = [...(iface.statistics ?? [])].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const samples: {
          inbound: number;
          outbound: number;
        }[] = [];

        for (let i = 1; i < statistics.length; i++) {
          const previous = statistics[i - 1];
          const current = statistics[i];

          const previousTime = new Date(previous.createdAt).getTime();

          const currentTime = new Date(current.createdAt).getTime();

          const elapsedSeconds = (currentTime - previousTime) / 1000;

          if (elapsedSeconds <= 0) {
            continue;
          }

          const previousIn = BigInt(previous.inOctets);
          const currentIn = BigInt(current.inOctets);

          const previousOut = BigInt(previous.outOctets);
          const currentOut = BigInt(current.outOctets);

          if (currentIn < previousIn || currentOut < previousOut) {
            continue;
          }

          const calculatedInbound =
            (Number(currentIn - previousIn) * 8) / elapsedSeconds;

          const calculatedOutbound =
            (Number(currentOut - previousOut) * 8) / elapsedSeconds;

          samples.push({
            inbound: calculatedInbound,
            outbound: calculatedOutbound,
          });
        }

        const inboundValues = samples.map((sample) => sample.inbound);

        const outboundValues = samples.map((sample) => sample.outbound);

        const latest = samples.length > 0 ? samples[samples.length - 1] : null;

        return {
          interfaceId: iface.id,
          interfaceName: iface.name,
          sourceNodeName,

          currentInbound: latest?.inbound ?? 0,
          currentOutbound: latest?.outbound ?? 0,

          averageInbound:
            inboundValues.length > 0
              ? inboundValues.reduce((sum, value) => sum + value, 0) /
                inboundValues.length
              : 0,

          averageOutbound:
            outboundValues.length > 0
              ? outboundValues.reduce((sum, value) => sum + value, 0) /
                outboundValues.length
              : 0,

          maxInbound: inboundValues.length > 0 ? Math.max(...inboundValues) : 0,

          maxOutbound:
            outboundValues.length > 0 ? Math.max(...outboundValues) : 0,
        };
      });
    }

    return [];
  }, [
    interfaces,
    sourceInterface,
    sourceNodeName,
    aggregatedInterfaces,
    inbound,
    outbound,
  ]);
  const trafficLegendTotals = useMemo(() => {
    const isAggregated = aggregatedInterfaces.length > 0;

    if (!isAggregated) {
      const stat = interfaceTrafficStats[0];

      return {
        inbound: stat?.currentInbound ?? 0,
        outbound: stat?.currentOutbound ?? 0,
        aggregated: false,
      };
    }

    return {
      inbound: interfaceTrafficStats.reduce(
        (total, stat) => total + stat.currentInbound,
        0,
      ),

      outbound: interfaceTrafficStats.reduce(
        (total, stat) => total + stat.currentOutbound,
        0,
      ),

      aggregated: true,
    };
  }, [interfaceTrafficStats, aggregatedInterfaces]);
  return (
    <div
      className="relative w-80 rounded-lg border bg-white shadow-xl p-3 text-xs "
      onMouseDown={onDragStart}
    >
      {/* Header */}

      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="font-semibold text-sm">Traffic</div>

          <div className="text-[10px] text-muted-foreground">
            {sourceNodeName} → {targetNodeName}
          </div>

          <div className="text-[10px] text-muted-foreground">
            {sourceInterfaceName} → {targetInterfaceName}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ============================= */}
      {/* GRAPH */}
      {/* ============================= */}

      <div
        className={
          isGraphFullscreen
            ? "absolute inset-0 z-50 bg-white p-3"
            : "relative h-48 w-full mb-4"
        }
      >
        {/* Graph header */}
        {isGraphFullscreen && (
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-semibold text-sm">Traffic Graph</div>

              <div className="text-[10px] text-muted-foreground">
                {sourceNodeName} → {targetNodeName}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGraphFullscreen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-gray-100"
              title="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Normal graph header */}
        {!isGraphFullscreen && (
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => setIsGraphFullscreen(true)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100"
              title="Expand graph"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Graph */}
        <div
          className={
            isGraphFullscreen ? "h-[calc(100%-40px)] w-full" : "h-40 w-full"
          }
        >
          {combinedChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedChartData}>
                <defs>
                  {chartData.map((interfaceChart, index) => {
                    const color =
                      AGGREGATED_COLORS[index % AGGREGATED_COLORS.length];
                    return (
                      <React.Fragment key={interfaceChart.interfaceId}>
                        <linearGradient
                          id={`inboundGradient-${interfaceChart.interfaceId}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={color}
                            stopOpacity={0.35}
                          />

                          <stop
                            offset="100%"
                            stopColor={color}
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        <linearGradient
                          id={`outboundGradient-${interfaceChart.interfaceId}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={color}
                            stopOpacity={0.35}
                          />

                          <stop
                            offset="100%"
                            stopColor={color}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </React.Fragment>
                    );
                  })}
                </defs>

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: isGraphFullscreen ? 11 : 8,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: isGraphFullscreen ? 11 : 8,
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatBandwidth(Number(value))}
                />

                <Tooltip
                  formatter={(value, name) => {
                    const interfaceId = String(name)
                      .replace("inbound_", "")
                      .replace("outbound_", "");

                    const interfaceChart = chartData.find(
                      (item) => String(item.interfaceId) === interfaceId,
                    );

                    const isInbound = String(name).startsWith("inbound_");

                    return [
                      formatBandwidth(Number(value)),
                      `${interfaceChart?.interfaceName ?? "Interface"} ${
                        isInbound ? "Inbound" : "Outbound"
                      }`,
                    ];
                  }}
                />

                {chartData.map((interfaceChart, index) => {
                  const color =
                    AGGREGATED_COLORS[index % AGGREGATED_COLORS.length];
                  return (
                    <React.Fragment key={interfaceChart.interfaceId}>
                      <Area
                        type="monotone"
                        dataKey={`inbound_${interfaceChart.interfaceId}`}
                        stroke={color}
                        fill={`url(#inboundGradient-${interfaceChart.interfaceId})`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />

                      <Area
                        type="monotone"
                        dataKey={`outbound_${interfaceChart.interfaceId}`}
                        stroke={color}
                        fill={`url(#outboundGradient-${interfaceChart.interfaceId})`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </React.Fragment>
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
              Waiting for traffic history...
            </div>
          )}
        </div>
      </div>

      {/* ============================= */}
      {/* TRAFFIC TOTAL / LEGEND */}
      {/* ============================= */}

      <div className="flex justify-center gap-6 mb-4 text-[10px]">
        {/* Inbound */}

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />

          <span className="text-muted-foreground">
            {trafficLegendTotals.aggregated ? "Total Inbound" : "Inbound"}
          </span>

          <span className="font-semibold text-green-500">
            ↓ {formatBandwidth(trafficLegendTotals.inbound)}
          </span>
        </div>

        {/* Outbound */}

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />

          <span className="text-muted-foreground">
            {trafficLegendTotals.aggregated ? "Total Outbound" : "Outbound"}
          </span>

          <span className="font-semibold text-blue-500">
            ↑ {formatBandwidth(trafficLegendTotals.outbound)}
          </span>
        </div>
      </div>

      {/* ============================= */}
      {/* INTERFACE STATISTICS */}
      {/* ============================= */}

      <div className="border-t pt-3">
        <div className="font-semibold text-xs mb-2">Interface Statistics</div>

        <div className="space-y-3">
          {interfaceTrafficStats.map((stat) => (
            <div key={stat.interfaceId} className="rounded-md border p-2">
              {/* Interface */}
              <div className="font-semibold text-[10px] mb-2">
                {stat.interfaceName}
                {stat.sourceNodeName && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    ({stat.sourceNodeName})
                  </span>
                )}
              </div>

              {/* Current */}
              <div className="flex items-center justify-between py-1">
                <div className="text-[9px] text-muted-foreground w-16">
                  Current
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Inbound
                    </div>
                    <div className="font-semibold text-green-500">
                      ↓ {formatBandwidth(stat.currentInbound)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Outbound
                    </div>
                    <div className="font-semibold text-blue-500">
                      ↑ {formatBandwidth(stat.currentOutbound)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Average */}
              <div className="flex items-center justify-between py-1 border-t">
                <div className="text-[9px] text-muted-foreground w-16">
                  Average
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Inbound
                    </div>
                    <div>{formatBandwidth(stat.averageInbound)}</div>
                  </div>

                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Outbound
                    </div>
                    <div>{formatBandwidth(stat.averageOutbound)}</div>
                  </div>
                </div>
              </div>

              {/* Maximum */}
              <div className="flex items-center justify-between py-1 border-t">
                <div className="text-[9px] text-muted-foreground w-16">
                  Maximum
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Inbound
                    </div>
                    <div>{formatBandwidth(stat.maxInbound)}</div>
                  </div>

                  <div>
                    <div className="text-[8px] text-muted-foreground">
                      Outbound
                    </div>
                    <div>{formatBandwidth(stat.maxOutbound)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
