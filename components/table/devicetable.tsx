"use client";

import { useMemo, useState, type MouseEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InterfaceMetric = {
  name: string;
  inbound: {
    current: number;
    average: number;
    max: number;
  };
  outbound: {
    current: number;
    average: number;
    max: number;
  };
};

const baseInterfaces: InterfaceMetric[] = [
  {
    name: "100GE0/1/55",
    inbound: { current: 10.87, average: 10.1, max: 19.04 },
    outbound: { current: 4.05, average: 3.62, max: 6.37 },
  },
  {
    name: "100GE0/1/56",
    inbound: { current: 8.12, average: 7.44, max: 15.22 },
    outbound: { current: 3.18, average: 2.91, max: 5.44 },
  },
  {
    name: "10GE0/0/1",
    inbound: { current: 2.14, average: 1.92, max: 3.88 },
    outbound: { current: 1.75, average: 1.6, max: 2.9 },
  },
  {
    name: "10GE0/0/2",
    inbound: { current: 3.44, average: 3.01, max: 6.21 },
    outbound: { current: 2.22, average: 1.98, max: 3.77 },
  },
  {
    name: "GE0/0/0",
    inbound: { current: 0, average: 0, max: 0 },
    outbound: { current: 0, average: 0, max: 0 },
  },
];

// Deterministic dummy interfaces so we can preview pagination across many
// pages (ellipsis, jumping to page N, etc.) without relying on Math.random(),
// which would produce different values on the server vs. the client and
// trigger a hydration mismatch.
function generateDummyInterfaces(count: number): InterfaceMetric[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const maxIn = Number((2 + ((n * 37) % 18)).toFixed(2));
    const maxOut = Number((1.5 + ((n * 23) % 12)).toFixed(2));
    return {
      name: `GE0/1/${n}`,
      inbound: {
        current: Number((maxIn * 0.55).toFixed(2)),
        average: Number((maxIn * 0.48).toFixed(2)),
        max: maxIn,
      },
      outbound: {
        current: Number((maxOut * 0.5).toFixed(2)),
        average: Number((maxOut * 0.42).toFixed(2)),
        max: maxOut,
      },
    };
  });
}

const interfaces: InterfaceMetric[] = [
  ...baseInterfaces,
  ...generateDummyInterfaces(40),
];

type Direction = "all" | "inbound" | "outbound";
type SortOption = "none" | "highest" | "lowest" | "name";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25];

const DIRECTION_LABELS: Record<Direction, string> = {
  all: "All Traffic",
  inbound: "Inbound Only",
  outbound: "Outbound Only",
};

const SORT_LABELS: Record<SortOption, string> = {
  none: "No Sorting",
  highest: "Highest Traffic",
  lowest: "Lowest Traffic",
  name: "Name (A\u2013Z)",
};

export function DeviceTable() {
  const [search, setSearch] = useState<string>("");
  const [direction, setDirection] = useState<Direction>("all");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [rawCurrentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let data = interfaces.filter((iface) =>
      iface.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    if (sortBy === "highest") {
      data = [...data].sort((a, b) => trafficTotal(b) - trafficTotal(a));
    } else if (sortBy === "lowest") {
      data = [...data].sort((a, b) => trafficTotal(a) - trafficTotal(b));
    } else if (sortBy === "name") {
      data = [...data].sort((a, b) => a.name.localeCompare(b.name));
    }

    return data;
  }, [search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  // Derived, not synced via an effect: if filtering/sorting/page-size shrinks
  // the result set below the stored page, just clamp it for this render.
  // No setState-in-effect, no extra re-render, no cascading updates.
  const currentPage = Math.min(rawCurrentPage, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const rangeStart =
    filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredData.length);

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100/50">
        <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
          Interface Statistics
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Router-Core-01 &bull; 24 Hour Traffic Summary
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-slate-100/40 bg-white/40 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="interface-search">
            Search interface
          </label>
          <input
            id="interface-search"
            type="text"
            placeholder="Search interface..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[200px] px-3 text-sm rounded-md border border-slate-200 bg-white/70 backdrop-blur-md placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />

          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as Direction)}
          >
            <SelectTrigger className="h-9! w-[200px]! text-sm" aria-label="Filter by traffic direction">
              <SelectValue>{() => DIRECTION_LABELS[direction]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Direction</SelectLabel>
                <SelectItem value="all">All Traffic</SelectItem>
                <SelectItem value="inbound">Inbound Only</SelectItem>
                <SelectItem value="outbound">Outbound Only</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9! w-[200px]! text-sm" aria-label="Sort interfaces">
              <SelectValue>{() => SORT_LABELS[sortBy]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="none">No Sorting</SelectItem>
                <SelectItem value="highest">Highest Traffic</SelectItem>
                <SelectItem value="lowest">Lowest Traffic</SelectItem>
                <SelectItem value="name">Name (A&ndash;Z)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          {filteredData.length > 0 && (
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {rangeStart}&ndash;{rangeEnd} of {filteredData.length}
            </span>
          )}

          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9! w-[130px]! text-sm" aria-label="Items per page">
              <SelectValue>{() => `${itemsPerPage} per page`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Per page</SelectLabel>
                {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} per page
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table body */}
      {filteredData.length === 0 ? (
        <EmptyState onClear={() => setSearch("")} hasSearch={search.length > 0} />
      ) : (
        <div className="divide-y divide-slate-100/40">
          {paginatedData.map((iface) => (
            <InterfaceRow key={iface.name} iface={iface} direction={direction} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredData.length > 0 && totalPages > 1 && (
        <div className="flex justify-center py-4 border-t border-slate-100/40 bg-slate-50/40">
          <InterfacePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="px-6 py-3 bg-slate-50/40 border-t border-slate-100/40 text-[10px] text-slate-400">
        Showing {filteredData.length} of {interfaces.length} interfaces &bull;
        Generated by Cacti
      </div>
    </div>
  );
}

function trafficTotal(iface: InterfaceMetric) {
  return iface.inbound.current + iface.outbound.current;
}

function isInterfaceDown(iface: InterfaceMetric) {
  return (
    iface.inbound.current === 0 &&
    iface.outbound.current === 0 &&
    iface.inbound.max === 0 &&
    iface.outbound.max === 0
  );
}

function InterfaceRow({
  iface,
  direction,
}: {
  iface: InterfaceMetric;
  direction: Direction;
}) {
  const down = isInterfaceDown(iface);

  return (
    <div className="px-6 py-5 hover:bg-white/40 transition-colors duration-150">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">
          {iface.name}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            down
              ? "bg-slate-100 text-slate-500"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              down ? "bg-slate-400" : "bg-emerald-500"
            }`}
          />
          {down ? "Down" : "Up"}
        </span>
      </div>

      <div
        className={`grid gap-6 ${
          direction === "all" ? "md:grid-cols-2" : "md:grid-cols-1"
        } ${down ? "opacity-50" : ""}`}
      >
        {(direction === "all" || direction === "inbound") && (
          <MetricBlock title="Inbound" color="#10b981" data={iface.inbound} />
        )}

        {(direction === "all" || direction === "outbound") && (
          <MetricBlock
            title="Outbound"
            color="#3b82f6"
            data={iface.outbound}
          />
        )}
      </div>
    </div>
  );
}

function MetricBlock({
  title,
  color,
  data,
}: {
  title: string;
  color: string;
  data: { current: number; average: number; max: number };
}) {
  const utilization =
    data.max > 0 ? Math.min(100, Math.round((data.current / data.max) * 100)) : 0;

  const barColor =
    utilization > 85 ? "#f43f5e" : utilization > 60 ? "#f59e0b" : color;

  return (
    <div className="rounded-lg border border-slate-100/50 p-4 bg-white/40 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">{utilization}% of max</span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <Stat label="Current" value={`${data.current} G`} />
        <Stat label="Average" value={`${data.average} G`} />
        <Stat label="Max" value={`${data.max} G`} highlight />
      </div>

      <div
        className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={utilization}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} utilization`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${utilization}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
        {label}
      </span>
      <span
        className={`font-mono font-semibold ${
          highlight ? "text-rose-500" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  hasSearch,
  onClear,
}: {
  hasSearch: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-medium text-slate-500">
        No interfaces match your filters.
      </p>
      {hasSearch && (
        <button
          onClick={onClear}
          className="text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-800"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

function InterfacePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const goTo = (page: number) => (e: MouseEvent) => {
    e.preventDefault();
    onPageChange(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={goTo(Math.max(currentPage - 1, 1))}
            aria-disabled={currentPage === 1}
            className={
              currentPage === 1 ? "pointer-events-none opacity-40" : undefined
            }
          />
        </PaginationItem>

        {generatePageNumbers(totalPages, currentPage).map((page, idx) =>
          page === "..." ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={currentPage === page}
                onClick={goTo(Number(page))}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={goTo(Math.min(currentPage + 1, totalPages))}
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-40"
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function generatePageNumbers(total: number, current: number) {
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);

    if (current > 4) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 3) pages.push("...");

    pages.push(total);
  }

  return pages;
}