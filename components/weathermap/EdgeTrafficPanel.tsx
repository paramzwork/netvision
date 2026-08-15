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
import { useMemo } from "react";
import { AggregatedInterface } from "@/app/(pages)/settings/weathermap/[id]/page";
import { X } from "lucide-react";

interface EdgeTrafficPanelProps {
  sourceNodeName: string;
  targetNodeName: string;
  sourceInterfaceName: string;
  targetInterfaceName: string;
  sourceInterface: InterfaceTypes | undefined;
  interfaces: InterfaceTypes[];
  aggregatedInterfaces: AggregatedInterface[];
  onClose: () => void;
}
type InterfaceTrafficStats = {
  interfaceId: number;
  interfaceName: string;
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

  sourceInterface,
  interfaces,

  onClose,
}: EdgeTrafficPanelProps) {
  const chartData = useMemo(() => {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // ==================================================
    // AGGREGATED LINK
    // ==================================================

    if (aggregatedInterfaces.length > 0) {
      const aggregatedChart = new Map<
        number,
        {
          inbound: number;
          outbound: number;
        }
      >();

      for (const aggregated of aggregatedInterfaces) {
        // Find the actual interface from Zustand
        const iface = interfaces.find(
          (item) => item.id === aggregated.interfaceId,
        );

        if (!iface?.statistics?.length) {
          continue;
        }

        // Only today's statistics
        const todayStats = [...iface.statistics]
          .filter((stat) => {
            const timestamp = new Date(stat.createdAt).getTime();

            return (
              timestamp >= startOfToday.getTime() &&
              timestamp <= endOfToday.getTime()
            );
          })
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

        if (todayStats.length < 2) {
          continue;
        }

        // Calculate traffic rate for this interface
        for (let i = 1; i < todayStats.length; i++) {
          const previous = todayStats[i - 1];
          const current = todayStats[i];

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

          const outbound =
            (Number(currentOut - previousOut) * 8) / elapsedSeconds;

          // Same timestamp = same point on graph
          const existing = aggregatedChart.get(currentTime);

          if (existing) {
            existing.inbound += inbound;
            existing.outbound += outbound;
          } else {
            aggregatedChart.set(currentTime, {
              inbound,
              outbound,
            });
          }
        }
      }

      return Array.from(aggregatedChart.entries())
        .sort(([timestampA], [timestampB]) => timestampA - timestampB)
        .map(([timestamp, traffic]) => ({
          timestamp,
          time: new Date(timestamp).toLocaleTimeString(),

          inbound: traffic.inbound,
          outbound: traffic.outbound,
        }));
    }

    // ==================================================
    // NORMAL LINK
    // ==================================================

    const statistics = sourceInterface?.statistics ?? [];

    const sorted = [...statistics]
      .filter((stat) => {
        const timestamp = new Date(stat.createdAt).getTime();

        return (
          timestamp >= startOfToday.getTime() &&
          timestamp <= endOfToday.getTime()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    if (sorted.length < 2) {
      return [];
    }

    return sorted.slice(1).map((current, index) => {
      const previous = sorted[index];

      const elapsedSeconds =
        (new Date(current.createdAt).getTime() -
          new Date(previous.createdAt).getTime()) /
        1000;

      if (elapsedSeconds <= 0) {
        return {
          time: new Date(current.createdAt).toLocaleTimeString(),
          timestamp: new Date(current.createdAt).getTime(),
          inbound: 0,
          outbound: 0,
        };
      }

      const currentIn = BigInt(current.inOctets);
      const previousIn = BigInt(previous.inOctets);

      const currentOut = BigInt(current.outOctets);
      const previousOut = BigInt(previous.outOctets);

      if (currentIn < previousIn || currentOut < previousOut) {
        return {
          time: new Date(current.createdAt).toLocaleTimeString(),
          timestamp: new Date(current.createdAt).getTime(),
          inbound: 0,
          outbound: 0,
        };
      }

      return {
        time: new Date(current.createdAt).toLocaleTimeString(),
        timestamp: new Date(current.createdAt).getTime(),

        inbound: (Number(currentIn - previousIn) * 8) / elapsedSeconds,

        outbound: (Number(currentOut - previousOut) * 8) / elapsedSeconds,
      };
    });
  }, [interfaces, sourceInterface, aggregatedInterfaces]);

  const interfaceTrafficStats = useMemo<InterfaceTrafficStats[]>(() => {
    const interfaceList =
      aggregatedInterfaces.length > 0
        ? aggregatedInterfaces
            .map((aggregated) =>
              interfaces.find((iface) => iface.id === aggregated.interfaceId),
            )
            .filter((iface): iface is InterfaceTypes => iface !== undefined)
        : sourceInterface
          ? [sourceInterface]
          : [];

    return interfaceList.map((iface) => {
      const now = new Date();

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      const statistics = [...(iface.statistics ?? [])]
        .filter((stat) => {
          const timestamp = new Date(stat.createdAt).getTime();

          return (
            timestamp >= startOfToday.getTime() &&
            timestamp <= endOfToday.getTime()
          );
        })
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      if (statistics.length < 2) {
        return {
          interfaceId: iface.id,
          interfaceName: iface.name,

          currentInbound: 0,
          currentOutbound: 0,

          averageInbound: 0,
          averageOutbound: 0,

          maxInbound: 0,
          maxOutbound: 0,
        };
      }

      const samples: {
        inbound: number;
        outbound: number;
      }[] = [];

      for (let i = 1; i < statistics.length; i++) {
        const current = statistics[i];
        const previous = statistics[i - 1];

        const elapsedSeconds =
          (new Date(current.createdAt).getTime() -
            new Date(previous.createdAt).getTime()) /
          1000;

        if (elapsedSeconds <= 0) {
          continue;
        }

        const currentIn = BigInt(current.inOctets);
        const previousIn = BigInt(previous.inOctets);

        const currentOut = BigInt(current.outOctets);
        const previousOut = BigInt(previous.outOctets);

        // Counter reset
        if (currentIn < previousIn || currentOut < previousOut) {
          continue;
        }

        samples.push({
          inbound: (Number(currentIn - previousIn) * 8) / elapsedSeconds,

          outbound: (Number(currentOut - previousOut) * 8) / elapsedSeconds,
        });
      }

      if (samples.length === 0) {
        return {
          interfaceId: iface.id,
          interfaceName: iface.name,

          currentInbound: 0,
          currentOutbound: 0,

          averageInbound: 0,
          averageOutbound: 0,

          maxInbound: 0,
          maxOutbound: 0,
        };
      }

      const inboundValues = samples.map((sample) => sample.inbound);

      const outboundValues = samples.map((sample) => sample.outbound);

      const latest = samples[samples.length - 1];

      return {
        interfaceId: iface.id,
        interfaceName: iface.name,

        currentInbound: latest.inbound,
        currentOutbound: latest.outbound,

        averageInbound:
          inboundValues.reduce((sum, value) => sum + value, 0) /
          inboundValues.length,

        averageOutbound:
          outboundValues.reduce((sum, value) => sum + value, 0) /
          outboundValues.length,

        maxInbound: Math.max(...inboundValues),

        maxOutbound: Math.max(...outboundValues),
      };
    });
  }, [interfaces, sourceInterface, aggregatedInterfaces]);

  return (
    <div
      className="
    w-80
    rounded-lg
    border
    bg-white
    shadow-xl
    p-3
    text-xs
  "
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

      <div className="h-40 w-full mb-4">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="inboundGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />

                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>

                <linearGradient
                  id="outboundGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />

                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
                tick={{ fontSize: 8 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{ fontSize: 8 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatBandwidth(Number(value))}
              />

              <Tooltip
                formatter={(value, name) => [
                  formatBandwidth(Number(value)),
                  name === "inbound" ? "Inbound" : "Outbound",
                ]}
              />

              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#22c55e"
                fill="url(#inboundGradient)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#3b82f6"
                fill="url(#outboundGradient)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
            Waiting for traffic history...
          </div>
        )}
      </div>

      {/* Legend */}

      <div className="flex justify-center gap-4 mb-4 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Inbound
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Outbound
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
              {/* Interface name */}

              <div className="font-semibold text-[10px] mb-2">
                {stat.interfaceName}
              </div>

              {/* Current */}

              <div className="mb-2">
                <div className="text-[9px] text-muted-foreground mb-1">
                  Current
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] text-muted-foreground">
                      Inbound
                    </div>

                    <div className="font-semibold text-green-500">
                      ↓ {formatBandwidth(stat.currentInbound)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-muted-foreground">
                      Outbound
                    </div>

                    <div className="font-semibold text-blue-500">
                      ↑ {formatBandwidth(stat.currentOutbound)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Average */}

              <div className="mb-2">
                <div className="text-[9px] text-muted-foreground mb-1">
                  Average
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] text-muted-foreground">
                      Inbound
                    </div>

                    <div>{formatBandwidth(stat.averageInbound)}</div>
                  </div>

                  <div>
                    <div className="text-[9px] text-muted-foreground">
                      Outbound
                    </div>

                    <div>{formatBandwidth(stat.averageOutbound)}</div>
                  </div>
                </div>
              </div>

              {/* Maximum */}

              <div>
                <div className="text-[9px] text-muted-foreground mb-1">
                  Maximum
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] text-muted-foreground">
                      Inbound
                    </div>

                    <div>{formatBandwidth(stat.maxInbound)}</div>
                  </div>

                  <div>
                    <div className="text-[9px] text-muted-foreground">
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
