"use client";

import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type RefObject,
  type ElementType,
} from "react";
import {
  CalendarIcon,
  AreaChart as AreaIcon,
  LineChart as LineIcon,
  LayoutGrid,
  Percent,
  Share2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { baseInterfaces } from "@/lib/interfaces";

/* ============================= */
/* GRAPH TYPES */
/* ============================= */

type GraphType = "stacked" | "percent" | "lines" | "grid" | "sankey";

/* ============================= */
/* TIME PRESETS */
/* ============================= */

type PresetKey =
  | "custom"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "12h"
  | "1d"
  | "2d"
  | "3d"
  | "4d"
  | "1w";

const PRESETS: { value: PresetKey; label: string; hours: number | null }[] = [
  { value: "custom", label: "Custom", hours: null },
  { value: "30m", label: "Last Half Hour", hours: 0.5 },
  { value: "1h", label: "Last Hour", hours: 1 },
  { value: "2h", label: "Last 2 Hours", hours: 2 },
  { value: "4h", label: "Last 4 Hours", hours: 4 },
  { value: "6h", label: "Last 6 Hours", hours: 6 },
  { value: "12h", label: "Last 12 Hours", hours: 12 },
  { value: "1d", label: "Last Day", hours: 24 },
  { value: "2d", label: "Last 2 Days", hours: 48 },
  { value: "3d", label: "Last 3 Days", hours: 72 },
  { value: "4d", label: "Last 4 Days", hours: 96 },
  { value: "1w", label: "Last Week", hours: 168 },
];

const PRESET_LABELS: Record<PresetKey, string> = PRESETS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<PresetKey, string>,
);

const GRAPH_LIMIT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

/* ============================= */
/* DATA */
/* ============================= */

const TOP_INTERFACES = [...baseInterfaces]
  .sort(
    (a, b) =>
      b.inbound.current +
      b.outbound.current -
      (a.inbound.current + a.outbound.current),
  )
  .slice(0, 10);

// Matches the accent colors already used across the dashboard
// (sky = Core Router / HTTP-HTTPS, indigo/violet = Edge Switch / DNS,
// emerald = SSH, amber = SNMP, red = alerts, plus a few more in the
// same family for interfaces beyond the first five).
const CHART_COLORS = [
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

type DataPoint = { timestamp: number } & Record<string, number | string>;

function generateSeries(
  anchor: number,
  points: number,
  stepMs: number,
): DataPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const timestamp = anchor - (points - 1 - i) * stepMs;
    const point: DataPoint = { timestamp };

    TOP_INTERFACES.forEach((iface, idx) => {
      const avg = iface.inbound.average + iface.outbound.average;
      const max = iface.inbound.max + iface.outbound.max;
      const amplitude = Math.max(0.2, max - avg);
      const period = 10 + idx * 3;
      const phase = idx * 1.3;
      const value = avg + amplitude * Math.sin(i / period + phase);
      point[iface.name] = Number(Math.max(0, value).toFixed(2));
    });

    return point;
  });
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTick(timestamp: number, spanMs: number) {
  const date = new Date(timestamp);
  const oneDay = 24 * 60 * 60 * 1000;
  if (spanMs <= oneDay * 1.5) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ============================= */
/* GRAPH TYPE SIDEBAR */
/* ============================= */

const GRAPH_TYPES: {
  key: GraphType;
  label: string;
  icon: ElementType;
}[] = [
  { key: "stacked", label: "Stacked", icon: AreaIcon },
  { key: "percent", label: "100%", icon: Percent },
  { key: "lines", label: "Lines", icon: LineIcon },
  { key: "grid", label: "Grid", icon: LayoutGrid },
  { key: "sankey", label: "Sankey", icon: Share2 },
];

/* ============================= */
/* CUSTOM TOOLTIP */
/* ============================= */

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
  hoveredInterface: string | null;
  displayedInterfaces: Array<{ name: string }>;
  chartColors: string[];
}

function CustomTooltip({
  active,
  label,
  payload,
  hoveredInterface,
  displayedInterfaces,
  chartColors,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const valueMap: Record<string, number> = {};
  payload.forEach((p) => {
    valueMap[p.name] = p.value;
  });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        minWidth: 220,
        fontSize: 12,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 8,
          color: "#334155",
          fontSize: 12,
        }}
      >
        {label}
      </div>
      {displayedInterfaces.map((iface, idx) => {
        const color = chartColors[idx];
        const value = valueMap[iface.name];
        const isHovered = hoveredInterface === iface.name;
        const isDimmed = hoveredInterface !== null && !isHovered;
        return (
          <div
            key={iface.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
              opacity: isDimmed ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#475569", flex: 1 }}>{iface.name}</span>
            <span
              style={{
                fontWeight: isHovered ? 700 : 500,
                color: isHovered ? "#0f172a" : "#64748b",
                marginLeft: 8,
              }}
            >
              {value !== undefined ? `${value.toFixed(2)} G` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================= */
/* CHART CONTENT (shared between normal and fullscreen) */
/* ============================= */

interface ChartContentProps {
  graphType: GraphType;
  visibleData: (DataPoint & { label: string })[];
  displayedInterfaces: typeof TOP_INTERFACES;
  hoveredInterface: string | null;
  setHoveredInterface: (name: string | null) => void;
  chartHeight?: number;
  fullHeight?: boolean;
}

function ChartContent({
  graphType,
  visibleData,
  displayedInterfaces,
  hoveredInterface,
  setHoveredInterface,
  chartHeight = 420,
  fullHeight = false,
}: ChartContentProps) {
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
            <YAxis />
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

/* ============================= */
/* COMPONENT */
/* ============================= */

export function TrafficChart() {
  const [preset, setPreset] = useState<PresetKey>("1d");
  const [graphType, setGraphType] = useState<GraphType>("stacked");
  const [graphLimit, setGraphLimit] = useState<number>(10);
  const [now] = useState(() => Date.now());
  const [hoveredInterface, setHoveredInterface] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [customFrom, setCustomFrom] = useState(() =>
    toLocalInputValue(new Date(now - 86400000)),
  );
  const [customTo, setCustomTo] = useState(() =>
    toLocalInputValue(new Date(now)),
  );

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const openPicker = (ref: RefObject<HTMLInputElement | null>) => {
    try {
      ref.current?.showPicker?.();
    } catch {
      ref.current?.focus();
    }
  };

  // Close fullscreen on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    },
    [isFullscreen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const fullSeries = useMemo(
    () => generateSeries(now, 7 * 48, 30 * 60 * 1000),
    [now],
  );

  const { from, to } = useMemo(() => {
    if (preset === "custom") {
      const fromDate = customFrom
        ? new Date(customFrom).getTime()
        : now - 86400000;
      const toDate = customTo ? new Date(customTo).getTime() : now;
      return {
        from: Math.min(fromDate, toDate),
        to: Math.max(fromDate, toDate),
      };
    }

    const preset_ = PRESETS.find((p) => p.value === preset);
    const hours = preset_?.hours ?? 24;
    return { from: now - hours * 3600000, to: now };
  }, [preset, customFrom, customTo, now]);

  const visibleData = useMemo(() => {
    const spanMs = to - from;
    return fullSeries
      .filter((d) => d.timestamp >= from && d.timestamp <= to)
      .map((d) => ({
        ...d,
        label: formatTick(d.timestamp, spanMs),
      }));
  }, [fullSeries, from, to]);

  const displayedInterfaces = TOP_INTERFACES.slice(0, graphLimit);

  /* ── Filters bar (shared between normal + fullscreen) ── */
  const FiltersBar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
        <SelectTrigger
          className="h-9! w-50! text-sm"
          aria-label="Select a preset time range"
        >
          <SelectValue>{() => PRESET_LABELS[preset]}</SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Presets</SelectLabel>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={String(graphLimit)}
        onValueChange={(v) => setGraphLimit(Number(v))}
      >
        <SelectTrigger
          className="h-9! w-50! text-sm"
          aria-label="Limit number of interfaces shown"
        >
          <SelectValue>{() => `Graph Limit: ${graphLimit}`}</SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Graph Limit</SelectLabel>
            {GRAPH_LIMIT_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <>
          <div className="relative">
            <input
              ref={fromInputRef}
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <button
              type="button"
              onClick={() => openPicker(fromInputRef)}
              aria-label="Open calendar for From date"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <CalendarIcon className="size-4" />
            </button>
          </div>

          <div className="relative">
            <input
              ref={toInputRef}
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <button
              type="button"
              onClick={() => openPicker(toInputRef)}
              aria-label="Open calendar for To date"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <CalendarIcon className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  /* ── Graph Type Sidebar ── */
  const GraphTypeSidebar = (isFs: boolean) => (
    <div
      className={`flex flex-col gap-1 border rounded-xl p-1.5 self-stretch justify-center ${
        isFs ? "bg-slate-50 border-slate-200" : "bg-slate-50 border-slate-200"
      }`}
    >
      {GRAPH_TYPES.map((item) => {
        const TypeIcon = item.icon;
        const isActive = graphType === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setGraphType(item.key)}
            title={item.label}
            aria-pressed={isActive}
            className={`
              flex flex-col items-center justify-center gap-1 w-12 py-2.5 rounded-lg text-xs font-medium transition-all
              ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
              }
            `}
          >
            <TypeIcon className="size-4 shrink-0" />
            <span className="leading-none">{item.label}</span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="my-1 h-px mx-1 bg-slate-200" />

      {/* Fullscreen Button */}
      <button
        onClick={() => setIsFullscreen((prev) => !prev)}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        aria-pressed={isFullscreen}
        className={`
          flex flex-col items-center justify-center gap-1 w-12 py-2.5 rounded-lg text-xs font-medium transition-all
          ${
            isFullscreen
              ? "bg-white text-slate-800 shadow-sm border border-slate-200"
              : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
          }
        `}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4 shrink-0" />
        ) : (
          <Maximize2 className="size-4 shrink-0" />
        )}
        <span className="leading-none">{isFullscreen ? "Exit" : "Full"}</span>
      </button>
    </div>
  );

  /* ── Fullscreen Overlay ── */
  if (isFullscreen) {
    const graphTypeLabel =
      GRAPH_TYPES.find((g) => g.key === graphType)?.label ?? graphType;
    const dataPointCount = visibleData.length;

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen chart view"
      >
        {/* ── Top Header Bar ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Logo / Title */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                }}
              >
                <AreaIcon className="size-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 leading-tight">
                  Traffic Chart
                </h2>
                <p className="text-xs text-slate-400 leading-tight">
                  Interface Bandwidth Overview
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-slate-200 mx-1" />

            {/* Active graph type badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {(() => {
                const G = GRAPH_TYPES.find((g) => g.key === graphType);
                if (!G) return null;
                const GIcon = G.icon;
                return <GIcon className="size-3 text-slate-400" />;
              })()}
              {graphTypeLabel}
            </span>
          </div>

          {/* Right controls — Esc hint only, no Exit button */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:block">
              Press{" "}
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-500 font-mono text-xs">
                Esc
              </kbd>{" "}
              to exit
            </span>
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div className="px-6 py-3 border-b border-slate-100 shrink-0 bg-slate-50/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Select
              value={preset}
              onValueChange={(v) => setPreset(v as PresetKey)}
            >
              <SelectTrigger
                className="h-9! w-50! text-sm"
                aria-label="Select a preset time range"
              >
                <SelectValue>{() => PRESET_LABELS[preset]}</SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
              >
                <SelectGroup>
                  <SelectLabel>Presets</SelectLabel>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(graphLimit)}
              onValueChange={(v) => setGraphLimit(Number(v))}
            >
              <SelectTrigger
                className="h-9! w-50! text-sm"
                aria-label="Limit number of interfaces shown"
              >
                <SelectValue>{() => `Graph Limit: ${graphLimit}`}</SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
              >
                <SelectGroup>
                  <SelectLabel>Graph Limit</SelectLabel>
                  {GRAPH_LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {preset === "custom" && (
              <>
                <div className="relative">
                  <input
                    ref={fromInputRef}
                    type="datetime-local"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker(fromInputRef)}
                    aria-label="Open calendar for From date"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <CalendarIcon className="size-4" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    ref={toInputRef}
                    type="datetime-local"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker(toInputRef)}
                    aria-label="Open calendar for To date"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <CalendarIcon className="size-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Chart Area ── */}
        <div className="flex flex-1 min-h-0 gap-3 p-5 bg-white">
          {/* Chart */}
          <div className="flex-1 min-w-0 rounded-xl border border-slate-100 overflow-hidden bg-white">
            <ChartContent
              graphType={graphType}
              visibleData={visibleData}
              displayedInterfaces={displayedInterfaces}
              hoveredInterface={hoveredInterface}
              setHoveredInterface={setHoveredInterface}
              fullHeight
            />
          </div>

          {/* Sidebar */}
          {GraphTypeSidebar(true)}
        </div>

        {/* ── Status Bar ── */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-slate-100 shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">
              <span className="text-slate-600 font-medium">
                {dataPointCount}
              </span>{" "}
              data points
            </span>
            <span className="text-xs text-slate-400">
              <span className="text-slate-600 font-medium">{graphLimit}</span>{" "}
              interface{graphLimit !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-slate-400">
              Range:{" "}
              <span className="text-slate-600 font-medium">
                {PRESET_LABELS[preset]}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {displayedInterfaces.slice(0, 6).map((iface, idx) => (
              <span key={iface.name} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: CHART_COLORS[idx] }}
                />
                <span className="text-xs text-slate-400 hidden lg:inline">
                  {iface.name}
                </span>
              </span>
            ))}
            {displayedInterfaces.length > 6 && (
              <span className="text-xs text-slate-400">
                +{displayedInterfaces.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Normal View ── */
  return (
    <div className="space-y-4">
      {/* Filters */}
      {FiltersBar}

      {/* Chart + Graph Type Sidebar */}
      <div className="flex gap-3 items-stretch">
        {/* Chart Area */}
        <div className="flex-1 min-w-0">
          <ChartContent
            graphType={graphType}
            visibleData={visibleData}
            displayedInterfaces={displayedInterfaces}
            hoveredInterface={hoveredInterface}
            setHoveredInterface={setHoveredInterface}
            chartHeight={420}
          />
        </div>

        {/* Vertical Graph Type Sidebar */}
        {GraphTypeSidebar(false)}
      </div>
    </div>
  );
}
