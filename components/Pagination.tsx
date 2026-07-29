"use client";

import { RoleTypes, UserTypes } from "@/lib/types";
import { useState } from "react";

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
    <div className="flex justify-between items-center mt-3">
      {/* 📊 Info */}
      <span className="text-sm">
        Showing {(page - 1) * limit + 1} -{" "}
        {Math.min(page * limit, filteredData.length)} of {filteredData.length}
      </span>

      {/* 🔢 Page Controls */}
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-2 border border-slate-500 bg-slate-500 hover:bg-white text-white hover:text-slate-500 transition-all duration-300 ease-in-out rounded-lg disabled:opacity-50 cursor-pointer active:scale-[.9]"
        >
          Prev
        </button>

        {/* Page Input */}
        <div className="flex items-center gap-1">
          <span className="text-sm">Page</span>

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
            className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center"
          />

          <span className="text-sm">of {totalPages}</span>
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-2 border border-slate-500 bg-slate-500 hover:bg-white text-white hover:text-slate-500 transition-all duration-300 ease-in-out rounded-lg disabled:opacity-50 cursor-pointer active:scale-[.9]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
