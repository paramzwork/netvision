"use client";

import { RoleTypes, UserTypes } from "@/lib/types";
import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  filteredData: RoleTypes[] | UserTypes[];
  data: RoleTypes[] | UserTypes[];
}
export default function Pagination({
  page,
  setPage,
  limit,
  filteredData,
  data,
}: Props) {
  const [pageInput, setPageInput] = useState<string>(page.toString());
  const totalPages =
    limit === data.length ? 1 : Math.ceil(filteredData.length / limit);
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 w-full pt-2">
      {/* 📊 Info */}
      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {(page - 1) * limit + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {Math.min(page * limit, filteredData.length)}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {filteredData.length}
        </span>{" "}
        results
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
            value={pageInput}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const value = e.target.value;

              if (!/^\d*$/.test(value)) return;
              if (value === "0") {
                setPageInput("1");
              } else if (Number(value) > totalPages) {
                setPageInput(String(totalPages));
              } else {
                setPageInput(value);
              }

              if (value === "") return;

              let pageNumber = Number(value);

              if (pageNumber < 1) {
                pageNumber = 1;
              } else if (pageNumber > totalPages) {
                pageNumber = totalPages;
              }
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
            className="h-8 gap-1 pl-2.5 pr-3 disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline-block">Prev</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 pl-3 pr-2.5 disabled:opacity-50"
            disabled={page === totalPages || totalPages === 0}
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
