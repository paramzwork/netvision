"use client";

import {
  DeviceInfoTypes,
  InterfaceTypes,
  RoleTypes,
  UserLog,
  UserTypes,
} from "@/lib/types";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopologyTypes } from "@/app/(pages)/weathermap/page";

interface Props {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: string;
  filteredData:
    | RoleTypes[]
    | UserTypes[]
    | UserLog[]
    | TopologyTypes[]
    | DeviceInfoTypes[]
    | InterfaceTypes[];
  data:
    | RoleTypes[]
    | UserTypes[]
    | UserLog[]
    | TopologyTypes[]
    | DeviceInfoTypes[]
    | InterfaceTypes[];
  total: number;
}
export default function Pagination({
  page,
  setPage,
  limit,
  filteredData,
  // data,
  total,
}: Props) {
  const isAll = limit === "all";

  const numericLimit = isAll ? total : Number(limit);

  const totalPages = isAll
    ? 1
    : numericLimit > 0
      ? Math.ceil(total / numericLimit)
      : 0;

  const isFirstPage = page <= 1;
  const isLastPage = isAll || page >= totalPages;

  const start =
    filteredData.length === 0 ? 0 : isAll ? 1 : (page - 1) * numericLimit + 1;

  const end =
    filteredData.length === 0
      ? 0
      : isAll
        ? filteredData.length
        : Math.min((page - 1) * numericLimit + filteredData.length, total);

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 w-full pt-2">
      {/* 📊 Info */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span> to{" "}
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> results
      </div>

      {/* 🔢 Page Controls */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Page Input */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
            Page
          </span>

          <input
            type="text"
            value={page}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const value = e.target.value;

              if (!/^\d*$/.test(value)) return;

              if (value === "") {
                setPage(1);
                return;
              }

              let pageNumber = Number(value);

              if (pageNumber < 1) {
                pageNumber = 1;
              } else if (pageNumber > totalPages) {
                pageNumber = totalPages;
              }

              setPage(pageNumber);
              setPage(pageNumber);
            }}
            min={1}
            max={totalPages}
            className="h-8 w-14 rounded-md border border-input bg-background px-2 text-center text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />

          <span className="text-sm font-medium text-muted-foreground">
            of {totalPages}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isFirstPage || totalPages === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline-block">Prev</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isLastPage || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            <span className="hidden sm:inline-block">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
