import { GraphType, InterfaceResponse, VisibleDataPoint } from "@/lib/types";
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
import React, { useRef, useState } from "react";

interface ChartContentProps {
  graphType: GraphType;
  visibleData: VisibleDataPoint[];
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
    const duration = to - from;

    let interval: number;

    if (duration <= 30 * 60 * 1000) {
      // Last 30 minutes → every 5 minutes
      interval = 5 * 60 * 1000;
    } else if (duration <= 60 * 60 * 1000) {
      // Last 1 hour → every 10 minutes
      interval = 10 * 60 * 1000;
    } else if (duration <= 3 * 60 * 60 * 1000) {
      // Last 3 hours → every 30 minutes
      interval = 30 * 60 * 1000;
    } else if (duration <= 24 * 60 * 60 * 1000) {
      // Last 24 hours → every 2 hours
      interval = 2 * 60 * 60 * 1000;
    } else {
      // More than 24 hours → every day
      interval = 24 * 60 * 60 * 1000;
    }

    const ticks: number[] = [];

    // Align the first tick to the interval
    const firstTick = Math.ceil(from / interval) * interval;

    // Include the beginning of the selected range
    ticks.push(from);

    for (let timestamp = firstTick; timestamp < to; timestamp += interval) {
      if (timestamp > from) {
        ticks.push(timestamp);
      }
    }

    // Include the end of the selected range
    if (ticks[ticks.length - 1] !== to) {
      ticks.push(to);
    }

    return ticks;
  }

  const xAxisTicks = React.useMemo(() => getXAxisTicks(from, to), [from, to]);
  const TOOLTIP_DELAY = 300;
  const [tooltipActive, setTooltipActive] = useState(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleChartMouseEnter = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }

    tooltipTimerRef.current = setTimeout(() => {
      setTooltipActive(true);
    }, TOOLTIP_DELAY);
  };

  const handleChartMouseLeave = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    setTooltipActive(false);
  };
  if (graphType === "grid") {
    const cols = 2;
    const rows = Math.ceil(displayedInterfaces.length / cols);
    const gap = 12;

    const cellHeight = fullHeight
      ? Math.max(180, Math.floor((chartHeight - gap * (rows - 1)) / rows))
      : 180;

    return (
      <div
        className="grid gap-3 w-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          ...(fullHeight
            ? {
                height: "100%",
              }
            : {}),
        }}
      >
        {displayedInterfaces.map((iface, idx) => {
          const color = CHART_COLORS[idx % CHART_COLORS.length];

          const gradientId = `grad-${iface.name.replace(
            /[^a-zA-Z0-9]/g,
            "-",
          )}-${idx}`;

          // ==========================================
          // Traffic statistics
          // ==========================================

          const values = visibleData
            .map((point) => point[iface.name])
            .filter(
              (value): value is number =>
                value !== null &&
                value !== undefined &&
                Number.isFinite(Number(value)),
            )
            .map(Number);

          const current = values.length > 0 ? values[values.length - 1] : 0;

          const average =
            values.length > 0
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : 0;

          const maximum = values.length > 0 ? Math.max(...values) : 0;

          return (
            <div
              key={iface.name}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
              style={{
                height: cellHeight,
              }}
            >
              {/* ================================= */}
              {/* INTERFACE LABEL */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* GRAPH */}
              {/* ================================= */}

              <div
                className="absolute left-0 right-0 top-0"
                style={{
                  height: cellHeight - 60,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={visibleData}
                    margin={{
                      top: 35,
                      right: 8,
                      bottom: 5,
                      left: 8,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id={gradientId}
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
                    </defs>

                    <XAxis dataKey="label" hide />

                    <YAxis hide domain={["auto", "auto"]} />

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

              {/* ================================= */}
              {/* TRAFFIC STATISTICS */}
              {/* ================================= */}

              <div className="absolute bottom-0 left-0 right-0 border-t bg-white px-3 py-2">
                <div className="grid grid-cols-3 divide-x">
                  {/* CURRENT */}

                  <div className="px-2 first:pl-0">
                    <div className="text-[9px] text-slate-400">Current</div>

                    <div className="text-xs font-semibold text-slate-700">
                      {formatBandwidth(current)}
                    </div>
                  </div>

                  {/* AVERAGE */}

                  <div className="px-2">
                    <div className="text-[9px] text-slate-400">Average</div>

                    <div className="text-xs font-semibold text-slate-700">
                      {formatBandwidth(average)}
                    </div>
                  </div>

                  {/* MAXIMUM */}

                  <div className="px-2 last:pr-0">
                    <div className="text-[9px] text-slate-400">Maximum</div>

                    <div className="text-xs font-semibold text-slate-700">
                      {formatBandwidth(maximum)}
                    </div>
                  </div>
                </div>
              </div>
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
            onMouseEnter={handleChartMouseEnter}
            onMouseLeave={handleChartMouseLeave}
          >
            <CartesianGrid stroke="rgba(100,116,139,0.25)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={[from, to]}
              ticks={xAxisTicks}
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
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
            <YAxis
              tickFormatter={(value) => formatBandwidth(value)}
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              active={tooltipActive}
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
                    connectNulls={false}
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
