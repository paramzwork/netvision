import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopologyTypes } from "@/app/(pages)/weathermap/page";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
} from "lucide-react";
import { TooltipComponent } from "../TooltipComponent";
import { tripleEncode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { useData } from "@/context/DataContext";
import EntriesPerPage from "../EntriesPerPage";
import Pagination from "../Pagination";

interface OverviewWeathermapTableProps {
  topologies: TopologyTypes[];
  setTopologies: React.Dispatch<React.SetStateAction<TopologyTypes[]>>;
  total: number;
}

export default function OverviewWeathermapTable({
  topologies,
  setTopologies,
  total,
}: OverviewWeathermapTableProps) {
  const { currentUser } = useData();
  // boolean
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<string>("10");
  const [search, setSearch] = useState<string>("");
  const [selectedID, setSelectedID] = useState<number>();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const router = useRouter();

  // 🔍 Filtered data
  const filteredData = useMemo(() => {
    return topologies.filter((item) => {
      const matchSearch = `${item.name}`
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      return matchSearch;
    });
  }, [topologies, search]);
  const sortData = <T,>(
    array: T[],
    key: keyof T,
    direction: "asc" | "desc",
  ): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return sortData(
      filteredData,
      sortConfig.key as keyof TopologyTypes,
      sortConfig.direction,
    );
  }, [filteredData, sortConfig]);

  const paginatedData = sortedData;
  const handleDelete = async () => {
    if (!selectedID) return;
    const toastID = toast.loading("Deleting...");
    const id = tripleEncode(String(selectedID));
    try {
      const res = await fetch(`/api/topology/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();

      if (!res.ok) {
        setConfirmDialog(false);
        toast.error(resData.message, { id: toastID });
        return;
      }
      setConfirmDialog(false);
      setTopologies((prev) => prev.filter((w) => w.id !== selectedID));
      toast.success(resData.message, { id: toastID });
    } catch {
      setConfirmDialog(false);
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedID(id);
    setConfirmDialog(true);
  };
  return (
    <div className="font-lexend border rounded-xl shadow-sm bg-background overflow-hidden">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="text-base font-semibold">Discovered Weathermaps</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {topologies.length || 0} weathermaps found
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full h-10 pl-9 pr-4 text-xs bg-background border border-input rounded-md ring-offset-background  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-full sm:w-auto">
            <EntriesPerPage
              limit={limit}
              setLimit={setLimit}
              setPage={setPage}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="font-lexend">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
              <TableHead
                className="font-medium cursor-pointer select-none group hidden md:table-cell"
                onClick={() =>
                  setSortConfig((prev) =>
                    prev?.key === "name" && prev.direction === "asc"
                      ? { key: "name", direction: "desc" }
                      : { key: "name", direction: "asc" },
                  )
                }
              >
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Name
                  {sortConfig?.key === "name" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead className="font-medium">Description</TableHead>
              {(currentUser.roles.role.toLowerCase() === "admin" ||
                currentUser.roles.role.toLowerCase() === "super admin") && (
                <TableHead className="font-medium text-center">...</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p>No devices discovered.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((dev, index) => (
                <TableRow
                  key={index}
                  className="group text-xs text-muted-foreground hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <TableCell
                    className="font-mono"
                    onClick={() => {
                      const id = tripleEncode(String(dev.id));
                      router.push(`/weathermap/${id}`);
                    }}
                  >
                    <p className="text-sky-500 hover:underline">{dev.name}</p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <TooltipComponent value={dev.description}>
                      <div className="max-w-md truncate cursor-pointer">
                        {dev.description}
                      </div>
                    </TooltipComponent>
                  </TableCell>
                  {(currentUser.roles.role.toLowerCase() === "admin" ||
                    currentUser.roles.role.toLowerCase() === "super admin") && (
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        onClick={() => confirmDelete(dev.id)}
                        title="Delete Weathermap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* BOTTOM PAGINATION */}
      <div className="p-4 border-t bg-muted/10">
        <Pagination
          page={page}
          setPage={setPage}
          limit={limit}
          data={topologies}
          filteredData={filteredData}
          total={total}
        />
      </div>
      <ConfirmationDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
