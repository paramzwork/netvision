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

interface ChartContentProps {
  graphType: GraphType;
  visibleData: (DataPoint & { label: string })[];
  displayedInterfaces: InterfaceResponse[];
  hoveredInterface: string | null;
  setHoveredInterface: (name: string | null) => void;
  chartHeight?: number;
  fullHeight?: boolean;
}

export default function ChartContent({
  graphType,
  visibleData,
  displayedInterfaces,
  hoveredInterface,
  setHoveredInterface,
  chartHeight = 420,
  fullHeight = false,
}: ChartContentProps) {
  console.log(visibleData);
  const containerStyle = fullHeight
    ? { height: "100%", width: "100%" }
    : { height: chartHeight };

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
          const color = CHART_COLORS[idx];
          return (
            <div
              key={iface.name}
              className="relative rounded-xl overflow-hidden border border-slate-200"
              style={{ background: "#ffffff", height: cellHeight }}
            >
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: "#fff", background: `${color}cc` }}
                >
                  {iface.name}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={cellHeight}>
                <AreaChart
                  data={visibleData}
                  margin={{ top: 32, right: 8, bottom: 8, left: 8 }}
                >
                  <defs>
                    <linearGradient
                      id={`grad-${idx}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                      <stop
                        offset="100%"
                        stopColor={color}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`${Number(value)} G`, iface.name]}
                    contentStyle={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={iface.name}
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${idx})`}
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
            <CartesianGrid
              stroke="rgba(148,163,184,0.08)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" />
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
              const baseColor = CHART_COLORS[idx];

              return (
                <Area
                  key={iface.name}
                  type="monotone"
                  dataKey={iface.name}
                  stackId={graphType !== "lines" ? "1" : undefined}
                  stroke={baseColor}
                  fill={graphType === "lines" ? "transparent" : baseColor}
                  fillOpacity={
                    isDimmed
                      ? 0.05
                      : isHovered
                        ? 0.45
                        : graphType === "lines"
                          ? 0
                          : 0.25
                  }
                  strokeWidth={
                    isHovered ? 2.5 : graphType === "lines" ? 2 : 1.5
                  }
                  strokeOpacity={isDimmed ? 0.15 : 1}
                  dot={false}
                  isAnimationActive={false}
                  onMouseEnter={() => setHoveredInterface(iface.name)}
                />
              );
            })}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
