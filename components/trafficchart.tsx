"use client"

import { useMemo, useRef, useState, type RefObject } from "react"
import { CalendarIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  | "1w"

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
]

const PRESET_LABELS: Record<PresetKey, string> = PRESETS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<PresetKey, string>,
)

type DataPoint = {
  timestamp: number
  cpu: number
  memory: number
  network: number
  disk: number
}

// Deterministic mock series: 7 days of history at 30-minute resolution.
// Values are derived from the point index only (no Math.random(), no live
// Date.now() read during render), so server and client renders agree and
// there's no hydration mismatch. Swap this out for a real API call later —
// the filtering logic below doesn't care where the points came from.
function generateSeries(anchor: number, points: number, stepMs: number): DataPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const timestamp = anchor - (points - 1 - i) * stepMs
    const wave = (base: number, amp: number, period: number, phase: number) =>
      Math.max(0, Math.round(base + amp * Math.sin(i / period + phase)))
    return {
      timestamp,
      cpu: wave(95, 50, 12, 0),
      memory: wave(75, 40, 15, 1),
      network: wave(58, 35, 10, 2),
      disk: wave(30, 15, 20, 3),
    }
  })
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function formatTick(timestamp: number, spanMs: number) {
  const date = new Date(timestamp)
  const oneDay = 24 * 60 * 60 * 1000
  if (spanMs <= oneDay * 1.5) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function TrafficChart() {
  const [preset, setPreset] = useState<PresetKey>("1d")
  const [now] = useState(() => Date.now())
  const [customFrom, setCustomFrom] = useState(() =>
    toLocalInputValue(new Date(now - 24 * 60 * 60 * 1000)),
  )
  const [customTo, setCustomTo] = useState(() => toLocalInputValue(new Date(now)))
  const fromInputRef = useRef<HTMLInputElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)

  const openPicker = (ref: RefObject<HTMLInputElement | null>) => {
    const el = ref.current
    if (!el) return
    // Optional chaining here is a runtime safety net: TypeScript's DOM types
    // say showPicker() always exists on HTMLInputElement, but not every
    // browser actually implements it yet (older Firefox, for example).
    // el.showPicker?.() calls it if present and silently no-ops if not,
    // rather than throwing at runtime.
    try {
      el.showPicker?.()
    } catch {
      el.focus()
    }
  }

  const fullSeries = useMemo(
    () => generateSeries(now, 7 * 48, 30 * 60 * 1000), // 7 days, 30-min steps
    [now],
  )

  const { from, to } = useMemo(() => {
    if (preset === "custom") {
      const fromDate = customFrom ? new Date(customFrom).getTime() : now - 24 * 60 * 60 * 1000
      const toDate = customTo ? new Date(customTo).getTime() : now
      return { from: Math.min(fromDate, toDate), to: Math.max(fromDate, toDate) }
    }
    const preset_ = PRESETS.find((p) => p.value === preset)
    const hours = preset_?.hours ?? 24
    return { from: now - hours * 60 * 60 * 1000, to: now }
  }, [preset, customFrom, customTo, now])

  const visibleData = useMemo(() => {
    const spanMs = to - from
    return fullSeries
      .filter((d) => d.timestamp >= from && d.timestamp <= to)
      .map((d) => ({ ...d, label: formatTick(d.timestamp, spanMs) }))
  }, [fullSeries, from, to])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
          <SelectTrigger className="h-9! w-[200px]! text-sm" aria-label="Select a preset time range">
            <SelectValue>{() => PRESET_LABELS[preset]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
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

        {preset === "custom" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              From:
              <div className="relative">
                <input
                  ref={fromInputRef}
                  type="datetime-local"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 [&::-webkit-calendar-picker-indicator]:opacity-0"
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
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              To:
              <div className="relative">
                <input
                  ref={toInputRef}
                  type="datetime-local"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white/70 pl-3 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 [&::-webkit-calendar-picker-indicator]:opacity-0"
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
            </label>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData}>
            <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />

            <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
              tickLine={{ stroke: "rgba(148,163,184,0.3)" }}
              padding={{ left: 10, right: 10 }}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
              tickLine={{ stroke: "rgba(148,163,184,0.3)" }}
              width={50}
            />

            <Tooltip
              cursor={{ stroke: "rgba(100,116,139,0.3)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              labelStyle={{
                color: "#94a3b8",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            />

            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="cpu"
              stackId="1"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#cpuGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stackId="1"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#memoryGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="network"
              stackId="1"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="url(#networkGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="disk"
              stackId="1"
              stroke="#f59e0b"
              strokeWidth={1.5}
              fill="url(#diskGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}