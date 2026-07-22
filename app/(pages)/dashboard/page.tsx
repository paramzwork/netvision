"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { baseInterfaces } from "@/lib/interfaces";
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  Server,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────── */
/* MOCK DATA — 2 devices                       */
/* ─────────────────────────────────────────── */

const DEVICES = [
  {
    id: "dev-1",
    name: "Core Router",
    ip: "192.168.1.1",
    mac: "AA:BB:CC:DD:EE:01",
    status: "online" as const,
    uptime: "14d 7h 22m",
    cpu: 38,
    memory: 61,
    interfaces: baseInterfaces.slice(0, 6),
    lastSeen: "Just now",
    type: "Router",
    location: "Server Room A",
  },
  {
    id: "dev-2",
    name: "Edge Switch",
    ip: "192.168.1.2",
    mac: "AA:BB:CC:DD:EE:02",
    status: "online" as const,
    uptime: "6d 3h 45m",
    cpu: 22,
    memory: 44,
    interfaces: baseInterfaces.slice(6, 12),
    lastSeen: "Just now",
    type: "Switch",
    location: "Server Room B",
  },
];

const REALTIME_STATS = {
  onlineSessions: 12,
  activeDevices: 2,
  failedSessionsToday: 3,
};

/* Activity chart — 7 days of hourly data points */
function generateActivityData() {
  const now = Date.now();
  const points = 7 * 24;
  return Array.from({ length: points }, (_, i) => {
    const ts = now - (points - 1 - i) * 3600000;
    const date = new Date(ts);
    const label = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    const hour = date.getHours();
    const base = 4 + Math.sin(i / 12) * 2;
    return {
      label,
      ts,
      device1: Number(
        Math.max(
          0,
          base + Math.sin(i / 8 + 0.5) * 3 + (hour > 8 && hour < 20 ? 2 : 0),
        ).toFixed(2),
      ),
      device2: Number(
        Math.max(
          0,
          base * 0.7 +
            Math.sin(i / 10 + 1.2) * 2 +
            (hour > 9 && hour < 18 ? 1.5 : 0),
        ).toFixed(2),
      ),
    };
  });
}

const ACTIVITY_DATA = generateActivityData();

/* Deduplicate labels for X-axis */
function dedupeLabels(data: typeof ACTIVITY_DATA) {
  const seen = new Set<string>();
  return data.map((d) => {
    if (seen.has(d.label)) return { ...d, label: "" };
    seen.add(d.label);
    return d;
  });
}

/* Traffic type proportion */
const TRAFFIC_TYPES = [
  { name: "HTTP/HTTPS", value: 42, color: "#38bdf8" },
  { name: "DNS", value: 18, color: "#818cf8" },
  { name: "SSH", value: 14, color: "#34d399" },
  { name: "SNMP", value: 11, color: "#fbbf24" },
  { name: "Other", value: 15, color: "#94a3b8" },
];

/* Access ranking data */
type RankPeriod = "today" | "weekly" | "monthly";

const ACCESS_RANKING: Record<
  RankPeriod,
  {
    rank: number;
    device: string;
    ip: string;
    sessions: number;
    bytes: string;
  }[]
> = {
  today: [
    {
      rank: 1,
      device: "Core Router",
      ip: "192.168.1.1",
      sessions: 48,
      bytes: "12.4 GB",
    },
    {
      rank: 2,
      device: "Edge Switch",
      ip: "192.168.1.2",
      sessions: 31,
      bytes: "8.7 GB",
    },
  ],
  weekly: [
    {
      rank: 1,
      device: "Core Router",
      ip: "192.168.1.1",
      sessions: 312,
      bytes: "87.2 GB",
    },
    {
      rank: 2,
      device: "Edge Switch",
      ip: "192.168.1.2",
      sessions: 198,
      bytes: "54.1 GB",
    },
  ],
  monthly: [
    {
      rank: 1,
      device: "Core Router",
      ip: "192.168.1.1",
      sessions: 1240,
      bytes: "342 GB",
    },
    {
      rank: 2,
      device: "Edge Switch",
      ip: "192.168.1.2",
      sessions: 876,
      bytes: "218 GB",
    },
  ],
};

const ALERT_RANKING: Record<
  RankPeriod,
  {
    rank: number;
    device: string;
    type: string;
    count: number;
    severity: "low" | "medium" | "high";
  }[]
> = {
  today: [
    {
      rank: 1,
      device: "Core Router",
      type: "High CPU",
      count: 3,
      severity: "medium",
    },
    {
      rank: 2,
      device: "Edge Switch",
      type: "Port Flap",
      count: 1,
      severity: "low",
    },
  ],
  weekly: [
    {
      rank: 1,
      device: "Core Router",
      type: "High CPU",
      count: 14,
      severity: "medium",
    },
    {
      rank: 2,
      device: "Edge Switch",
      type: "Port Flap",
      count: 7,
      severity: "low",
    },
  ],
  monthly: [
    {
      rank: 1,
      device: "Core Router",
      type: "High CPU",
      count: 52,
      severity: "high",
    },
    {
      rank: 2,
      device: "Edge Switch",
      type: "Port Flap",
      count: 28,
      severity: "medium",
    },
  ],
};

/* ─────────────────────────────────────────── */
/* HELPERS                                     */
/* ─────────────────────────────────────────── */

function StatusDot({ status }: { status: "online" | "offline" }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        status === "online" ? "bg-emerald-400" : "bg-red-400"
      }`}
    />
  );
}

function MiniBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${map[severity]}`}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

/* ─────────────────────────────────────────── */
/* MAIN COMPONENT                              */
/* ─────────────────────────────────────────── */

export default function DashboardPage() {
  const [accessPeriod, setAccessPeriod] = useState<RankPeriod>("weekly");
  const [alertPeriod, setAlertPeriod] = useState<RankPeriod>("weekly");

  const chartData = useMemo(() => dedupeLabels(ACTIVITY_DATA), []);

  /* Aggregate interface bandwidth for the 2 devices */
  const totalInbound = DEVICES.reduce(
    (sum, d) => sum + d.interfaces.reduce((s, i) => s + i.inbound.current, 0),
    0,
  );
  const totalOutbound = DEVICES.reduce(
    (sum, d) => sum + d.interfaces.reduce((s, i) => s + i.outbound.current, 0),
    0,
  );

  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* ── Row 1: Real-time + Device Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real-time stats card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-sky-50 flex items-center justify-center">
              <Activity className="size-3.5 text-sky-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              Real-time
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Online Sessions
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {REALTIME_STATS.onlineSessions}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Active Devices
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {REALTIME_STATS.activeDevices}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Failed Today
              </p>
              <p className="text-3xl font-bold text-red-500">
                {REALTIME_STATS.failedSessionsToday}
              </p>
            </div>
          </div>
        </div>

        {/* Device 1 summary */}
        {DEVICES.map((device) => (
          <div
            key={device.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Server className="size-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {device.name}
                  </p>
                  <p className="text-xs text-slate-400 leading-tight">
                    {device.type} · {device.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={device.status} />
                <span className="text-xs font-medium text-emerald-600 capitalize">
                  {device.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">
                  Total Devices
                </p>
                <p className="text-xl font-bold text-slate-900">1</p>
                <p className="text-[10px] text-slate-400">IP: {device.ip}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Uptime</p>
                <p className="text-sm font-semibold text-slate-700">
                  {device.uptime}
                </p>
                <p className="text-[10px] text-slate-400">
                  Last seen: {device.lastSeen}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-slate-400">CPU</span>
                  <span className="text-[10px] font-medium text-slate-600">
                    {device.cpu}%
                  </span>
                </div>
                <MiniBar
                  value={device.cpu}
                  color={device.cpu > 70 ? "#f87171" : "#38bdf8"}
                />
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-slate-400">Memory</span>
                  <span className="text-[10px] font-medium text-slate-600">
                    {device.memory}%
                  </span>
                </div>
                <MiniBar
                  value={device.memory}
                  color={device.memory > 80 ? "#f87171" : "#818cf8"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Activity Chart + Donut Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Device Activity
              </h2>
              <p className="text-xs text-slate-400">
                Bandwidth over last 7 days (Gbps)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: "#38bdf8" }}
                />
                Core Router
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: "#818cf8" }}
                />
                Edge Switch
              </span>
            </div>
          </div>
          <div className="h-50">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad-d1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#38bdf8"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="grad-d2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#818cf8"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(148,163,184,0.08)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={23}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value, name) => {
                    const label =
                      name === "device1" ? "Core Router" : "Edge Switch";
                    return [`${Number(value).toFixed(2)} G`, label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="device1"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  fill="url(#grad-d1)"
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="device2"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  fill="url(#grad-d2)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interface Bandwidth Overview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
              <Zap className="size-3.5 text-violet-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              Interface Bandwidth
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="size-3 text-sky-500" />
                <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide">
                  Inbound
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {totalInbound.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-400">Gbps total</p>
            </div>
            <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="size-3 text-violet-500" />
                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">
                  Outbound
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {totalOutbound.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-400">Gbps total</p>
            </div>
          </div>

          <div className="space-y-2">
            {DEVICES.map((device) => {
              const devIn = device.interfaces.reduce(
                (s, i) => s + i.inbound.current,
                0,
              );
              const devOut = device.interfaces.reduce(
                (s, i) => s + i.outbound.current,
                0,
              );
              const maxBw = 80;
              return (
                <div
                  key={device.id}
                  className="rounded-lg border border-slate-100 p-2.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700">
                      {device.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {device.interfaces.length} ifaces
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-slate-400">↓ In</span>
                        <span className="text-[10px] font-medium text-slate-600">
                          {devIn.toFixed(1)} G
                        </span>
                      </div>
                      <MiniBar value={devIn} max={maxBw} color="#38bdf8" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-slate-400">
                          ↑ Out
                        </span>
                        <span className="text-[10px] font-medium text-slate-600">
                          {devOut.toFixed(1)} G
                        </span>
                      </div>
                      <MiniBar value={devOut} max={maxBw} color="#818cf8" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Traffic Type Proportion ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
            <Shield className="size-3.5 text-amber-500" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">
            Traffic Type Proportion
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Donut */}
          <div className="shrink-0 w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={TRAFFIC_TYPES}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {TRAFFIC_TYPES.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value}%`,
                    item?.payload?.name ?? "",
                  ]}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked bar breakdown */}
          <div className="flex-1 w-full space-y-2.5">
            {TRAFFIC_TYPES.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ background: t.color }}
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {t.value}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${t.value}%`, background: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Ranking Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Access Ranking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-50 flex items-center justify-center">
                <Wifi className="size-3.5 text-sky-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">
                Device Access Ranking
              </h2>
            </div>
            <div className="flex gap-1">
              {(["today", "weekly", "monthly"] as RankPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setAccessPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                    accessPeriod === p
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2 w-8">
                  Rank
                </th>
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Device
                </th>
                <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Sessions
                </th>
                <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Traffic
                </th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_RANKING[accessPeriod].map((row) => (
                <tr
                  key={row.rank}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                        row.rank === 1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <p className="text-xs font-medium text-slate-800">
                      {row.device}
                    </p>
                    <p className="text-[10px] text-slate-400">{row.ip}</p>
                  </td>
                  <td className="py-2.5 text-right text-xs font-semibold text-slate-700">
                    {row.sessions}
                  </td>
                  <td className="py-2.5 text-right text-xs text-slate-500">
                    {row.bytes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alert Ranking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
                <AlertTriangle className="size-3.5 text-red-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">
                Alert Ranking
              </h2>
            </div>
            <div className="flex gap-1">
              {(["today", "weekly", "monthly"] as RankPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setAlertPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                    alertPeriod === p
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2 w-8">
                  Rank
                </th>
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Device
                </th>
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Alert Type
                </th>
                <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Count
                </th>
                <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody>
              {ALERT_RANKING[alertPeriod].map((row) => (
                <tr
                  key={row.rank}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                        row.rank === 1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <p className="text-xs font-medium text-slate-800">
                      {row.device}
                    </p>
                  </td>
                  <td className="py-2.5">
                    <p className="text-xs text-slate-500">{row.type}</p>
                  </td>
                  <td className="py-2.5 text-right text-xs font-semibold text-slate-700">
                    {row.count}
                  </td>
                  <td className="py-2.5 text-right">
                    <SeverityBadge severity={row.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 5: Device Status Cards (detailed) ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="size-4 text-slate-400" />
          Device Status Detail
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {DEVICES.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      device.status === "online" ? "bg-emerald-50" : "bg-red-50"
                    }`}
                  >
                    {device.status === "online" ? (
                      <Wifi className="size-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="size-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {device.name}
                    </p>
                    <p className="text-xs text-slate-400">{device.mac}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <StatusDot status={device.status} />
                    <span className="text-xs font-medium text-emerald-600 capitalize">
                      {device.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Up {device.uptime}
                  </p>
                </div>
              </div>

              {/* Interface list */}
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">
                        Interface
                      </th>
                      <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">
                        In (G)
                      </th>
                      <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">
                        Out (G)
                      </th>
                      <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">
                        Max In
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.interfaces.slice(0, 5).map((iface) => (
                      <tr
                        key={iface.name}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono font-medium text-slate-700">
                            {iface.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-sky-600 font-medium">
                          {iface.inbound.current.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-violet-600 font-medium">
                          {iface.outbound.current.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-slate-400">
                          {iface.inbound.max.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
