import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Props {
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}
export default function EntriesPerPage({
  limit,
  setLimit,
  setPage,
  totalPages,
}: Props) {
  return (
    <Select
      value={String(limit)}
      onValueChange={(e) => {
        setLimit(e === "all" ? totalPages : Number(e));
        setPage(1);
      }}
    >
      <SelectTrigger className="w-20 h-11! bg-white border-slate-300 text-slate-500 cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectGroup>
          <SelectItem
            value="10"
            className="text-slate-500 hover:bg-slate-100 cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            10
          </SelectItem>
          <SelectItem
            value="50"
            className="text-slate-500 hover:bg-slate-100 cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            50
          </SelectItem>
          <SelectItem
            value="100"
            className="text-slate-500 hover:bg-slate-100 cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            100
          </SelectItem>
          <SelectItem
            value="all"
            className="text-slate-500 hover:bg-slate-100 cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            All
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
