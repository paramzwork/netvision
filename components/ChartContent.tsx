import { DataPoint, GraphType, InterfaceResponse } from "@/lib/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { CHART_COLORS, formatBandwidth } from "@/lib/utils";
import React from "react";

interface ChartContentProps {
  graphType: GraphType;
  visibleData: (DataPoint & { label: string })[];
  displayedInterfaces: InterfaceResponse[];
  hoveredInterface: string | null;
  setHoveredInterface: (name: string | null) => void;
  chartHeight?: number;
  fullHeight?: boolean;
  from: number;
  to: number;
}

export default function ChartContent({
  graphType,
  visibleData,
  displayedInterfaces,
  hoveredInterface,
  setHoveredInterface,
  chartHeight = 420,
  fullHeight = false,
  from,
  to,
}: ChartContentProps) {
  const containerStyle = fullHeight
    ? { height: "100%", width: "100%" }
    : { height: chartHeight };
  function getXAxisTicks(from: number, to: number) {
    const ticks: number[] = [];

    const start = new Date(from);
    const end = new Date(to);

    // Start at midnight
    start.setHours(0, 0, 0, 0);

    // If range is more than 24 hours, use calendar dates
    if (to - from > 24 * 60 * 60 * 1000) {
      while (start <= end) {
        ticks.push(start.getTime());

        start.setDate(start.getDate() + 1);
      }

      return ticks;
    }

    // For shorter ranges, generate hourly ticks
    start.setMinutes(0, 0, 0);

    while (start <= end) {
      ticks.push(start.getTime());

      start.setHours(start.getHours() + 1);
    }

    return ticks;
  }
  const xAxisTicks = React.useMemo(() => getXAxisTicks(from, to), [from, to]);
  if (graphType === "grid") {
    const cols = 2;
    const rows = Math.ceil(displayedInterfaces.length / cols);
    const gap = 12;

    const totalHeight = fullHeight ? undefined : chartHeight;

    const cellHeight = totalHeight
      ? Math.floor((totalHeight - gap * (rows - 1)) / rows)
      : 180;

    return (
      <div
        className="grid gap-3"
        style={{
          ...(fullHeight ? { height: "100%", width: "100%" } : {}),
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
      >
        {displayedInterfaces.map((iface, idx) => {
          const color = CHART_COLORS[idx % CHART_COLORS.length];

          const gradientId = `grad-${iface.name.replace(
            /[^a-zA-Z0-9]/g,
            "-",
          )}-${idx}`;

          return (
            <div
              key={iface.name}
              className="relative overflow-hidden rounded-xl border border-slate-200"
              style={{
                background: "#ffffff",
                height: cellHeight,
              }}
            >
              {/* Interface label */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    color: "#fff",
                    background: `${color}cc`,
                  }}
                >
                  {iface.name}: {iface.description}
                </span>
              </div>

              <ResponsiveContainer width="100%" height={cellHeight}>
                <AreaChart
                  key={`${visibleData.length}-${visibleData.at(-1)?.timestamp}`}
                  data={visibleData}
                  margin={{
                    top: 32,
                    right: 8,
                    bottom: 8,
                    left: 8,
                  }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />

                      <stop
                        offset="100%"
                        stopColor={color}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="label" hide />

                  <YAxis hide />

                  <Tooltip
                    formatter={(value) => [
                      formatBandwidth(Number(value)),
                      iface.name,
                    ]}
                    contentStyle={{
                      fontSize: 11,
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey={iface.name}
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={containerStyle} onMouseLeave={() => setHoveredInterface(null)}>
      <ResponsiveContainer width="100%" height="100%">
        {graphType === "sankey" ? (
          <AreaChart data={[]}>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize={14}
            >
              Sankey view coming soon...
            </text>
          </AreaChart>
        ) : (
          <AreaChart
            data={visibleData}
            stackOffset={graphType === "percent" ? "expand" : "none"}
          >
            <CartesianGrid stroke="rgba(100,116,139,0.25)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={[from, to]}
              ticks={xAxisTicks}
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);

                if (to - from > 24 * 60 * 60 * 1000) {
                  return date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                }

                return date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tickFormatter={(value) => formatBandwidth(value)} />
            <Tooltip
              content={
                <CustomTooltip
                  hoveredInterface={hoveredInterface}
                  displayedInterfaces={displayedInterfaces}
                  chartColors={CHART_COLORS}
                />
              }
            />
            {displayedInterfaces.map((iface, idx) => {
              const isHovered = hoveredInterface === iface.name;
              const isDimmed = hoveredInterface !== null && !isHovered;

              const baseColor = CHART_COLORS[idx % CHART_COLORS.length];

              const gradientId = `main-grad-${iface.name.replace(
                /[^a-zA-Z0-9]/g,
                "-",
              )}-${idx}`;

              return (
                <React.Fragment key={iface.name}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={baseColor}
                        stopOpacity={isDimmed ? 0.05 : 0.65}
                      />

                      <stop
                        offset="100%"
                        stopColor={baseColor}
                        stopOpacity={isDimmed ? 0.01 : 0.22}
                      />
                    </linearGradient>
                  </defs>

                  <Area
                    type="monotone"
                    dataKey={iface.name}
                    stackId={graphType !== "lines" ? "1" : undefined}
                    stroke={baseColor}
                    fill={
                      graphType === "lines"
                        ? "transparent"
                        : `url(#${gradientId})`
                    }
                    fillOpacity={
                      graphType === "lines"
                        ? 0
                        : isDimmed
                          ? 0.05
                          : isHovered
                            ? 0.45
                            : 1
                    }
                    strokeWidth={
                      isHovered ? 2.5 : graphType === "lines" ? 2 : 1.5
                    }
                    strokeOpacity={isDimmed ? 0.15 : 1}
                    dot={false}
                    isAnimationActive={false}
                    onMouseEnter={() => setHoveredInterface(iface.name)}
                  />
                </React.Fragment>
              );
            })}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
