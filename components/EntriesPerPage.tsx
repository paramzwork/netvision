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
      <SelectTrigger className="w-20 h-11! bg-white border-[#3b3b3b] text-[#3b3b3b] cursor-pointer text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectGroup>
          <SelectItem
            value="10"
            className="text-[#3b3b3b] text-xs hover:bg-[#3b3b3b] cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            10
          </SelectItem>
          <SelectItem
            value="50"
            className="text-[#3b3b3b] text-xs hover:bg-[#3b3b3b] cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            50
          </SelectItem>
          <SelectItem
            value="100"
            className="text-[#3b3b3b] text-xs hover:bg-[#3b3b3b] cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            100
          </SelectItem>
          <SelectItem
            value="all"
            className="text-[#3b3b3b] text-xs hover:bg-[#3b3b3b] cursor-pointer trasition-all duration-300 ease-in-out p-2"
          >
            All
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
