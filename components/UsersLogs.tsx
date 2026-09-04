"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserLog, UserLogsResponse } from "@/lib/types";
import { useUserLogsStore } from "@/store/user-store";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { Button } from "./ui/button";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { tripleEncode } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import Pagination from "./Pagination";
import { TooltipComponent } from "./TooltipComponent";
import EntriesPerPage from "./EntriesPerPage";

export default function UsersLogsPage() {
  const { currentUser } = useData();
  
  const { userLogs, setUserLogs, total, setTotal } = useUserLogsStore();
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const [selectedID, setSelectedID] = useState<number>();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<string>("10");
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const router = useRouter();

  // 🔍 Filtered data
  const filteredData = useMemo(() => {
    return userLogs.filter((item) => {
      const matchSearch =
        `${item.users?.username} ${item.users?.firstname} ${item.action} ${item.users?.roles.role}`
          .toLowerCase()
          .includes(search.toLowerCase().trim());

      return matchSearch;
    });
  }, [userLogs, search]);
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
      sortConfig.key as keyof UserLog,
      sortConfig.direction,
    );
  }, [filteredData, sortConfig]);

  const paginatedData = sortedData;
  const fetchAllUserLogs = useCallback(async () => {
    const allLogs: UserLog[] = [];

    let currentPage = 1;
    const batchSize = 20;
    let total = 0;

    while (true) {
      console.log(`Fetching page ${currentPage}`);

      const res = await fetch(
        `/api/users/logs?page=${currentPage}&limit=${batchSize}`,
      );

      if (res.status === 401) {
        router.replace("/");
        return null;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch user logs");
      }

      const result: UserLogsResponse = await res.json();

      total = result.total;

      allLogs.push(...result.data);

      console.log(`Page ${currentPage}: ${result.data.length} records`);

      console.log(`Loaded ${allLogs.length} / ${total}`);

      // We have everything
      if (allLogs.length >= total) {
        break;
      }

      // Safety check
      if (result.data.length === 0) {
        break;
      }

      currentPage++;
    }

    console.log("Finished loading:", allLogs.length);

    return allLogs;
  }, [router]);
  useEffect(() => {
    const fetchUserLogs = async () => {
      try {
        if (limit === "all") {
          const allLogs = await fetchAllUserLogs();

          if (allLogs) {
            setUserLogs(allLogs);
          }

          return;
        }

        const res = await fetch(`/api/users/logs?page=${page}&limit=${limit}`);

        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch user logs");
        }

        const result: UserLogsResponse = await res.json();

        setUserLogs(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error fetching user logs:", error);
      }
    };

    fetchUserLogs();
  }, [page, limit, router, setUserLogs, setTotal, fetchAllUserLogs]);
  const handleDelete = async () => {
    try {
      const toastID = toast.loading("Deleting log...");
      const id = tripleEncode(String(selectedID));

      const res = await fetch(`/api/users/logs/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) {
        if (res.status) {
          router.replace("/");
          return;
        }
        toast.error(resData.message, { id: toastID });
        return;
      }
      setUserLogs((prev) => prev.filter((log) => log.id !== selectedID));
      setConfirmDialog(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          View user activities and system actions.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-5 border-b bg-muted/20">
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
          <EntriesPerPage limit={limit} setLimit={setLimit} setPage={setPage} />
        </div>
      </div>
      {/* Logs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center font-medium">No</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead
                className="font-medium cursor-pointer select-none group hidden md:table-cell"
                onClick={() =>
                  setSortConfig((prev) =>
                    prev?.key === "createdAt" && prev.direction === "asc"
                      ? { key: "createdAt", direction: "desc" }
                      : { key: "createdAt", direction: "asc" },
                  )
                }
              >
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Date & Time
                  {sortConfig?.key === "createdAt" ? (
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
              {currentUser.roles.role.toLowerCase() === "super admin" && (
                <TableHead className="text-center">...</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((log, index) => (
                <TableRow key={log.id} className="hover:bg-sky-50">
                  {/* User */}
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {limit === "all"
                      ? index + 1
                      : (page - 1) * Number(limit) + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {log.users?.username ?? "Deleted User"}
                      </span>

                      {log.users && (
                        <span className="text-xs text-muted-foreground">
                          {[log.users.firstname, log.users.lastname]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium text-xs border ${
                        log.users?.roles?.role === "Admin"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
                          : log.users?.roles?.role === "User"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                    >
                      {log.users?.roles?.role ?? "N/A"}
                    </Badge>
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>

                  {/* Description */}
                  <TableCell>
                    {log.description!.length > 50 ? (
                      <TooltipComponent value={log.description || ""}>
                        <div className="max-w-md truncate cursor-pointer">
                          {log.description!.length > 50
                            ? `${log.description!.slice(0, 50)}...`
                            : log.description}
                        </div>
                      </TooltipComponent>
                    ) : (
                      log.description
                    )}
                  </TableCell>

                  {/* IP Address */}
                  <TableCell className="font-mono text-sm">
                    {log.ip_address ?? "-"}
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  {currentUser.roles.role.toLowerCase() === "super admin" && (
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity md:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          onClick={() => confirmDelete(log.id)}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No user logs found.
                </TableCell>
              </TableRow>
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
          data={userLogs}
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
