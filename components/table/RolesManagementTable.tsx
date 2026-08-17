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
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronDown, ChevronUp, PencilLine, Search, Trash2 } from "lucide-react";
import { RoleTypes } from "@/lib/types";
import { useMemo, useState } from "react";
import Pagination from "../Pagination";
import { toast } from "sonner";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { tripleEncode } from "@/lib/utils";
import EntriesPerPage from "../EntriesPerPage";

interface Props {
  roleData: RoleTypes[];
  setRoleData: React.Dispatch<React.SetStateAction<RoleTypes[]>>;
  setSelectedRole: React.Dispatch<React.SetStateAction<RoleTypes | null>>;
  handleForm: (type: string) => void;
}

export default function RolesManagementTable({
  roleData,
  setRoleData,
  setSelectedRole,
  handleForm,
}: Props) {
  const handleSelectedRole = async (value: RoleTypes) => {
    setSelectedRole(value);
    handleForm("edit");
  };
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const [selectedID, setSelectedID] = useState<number>();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // 🔍 Filtered data
  const filteredData = useMemo(() => {
    return roleData.filter((item) => {
      const matchSearch = `${item.role} ${item.id}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchSearch;
    });
  }, [roleData, search]);
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
  const start = (page - 1) * limit;

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return sortData(
      filteredData,
      sortConfig.key as keyof RoleTypes,
      sortConfig.direction,
    );
  }, [filteredData, sortConfig]);

  const paginatedData =
    limit === roleData.length
      ? sortedData
      : sortedData.slice(start, start + limit);
  const handleDelete = async () => {
    if (!selectedID) return;
    const toastID = toast.loading("Deleting...");
    const id = tripleEncode(String(selectedID));
    try {
      const res = await fetch(`/api/users/role/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();

      if (!res.ok) {
        setConfirmDialog(false);
        toast.error(resData.message, { id: toastID });
        return;
      }
      setConfirmDialog(false);
      setRoleData((prev) => prev.filter((role) => role.id !== selectedID));
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
    <div className="flex flex-col w-full bg-background border rounded-xl shadow-sm overflow-hidden">
      {/* TOP TOOLBAR: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-5 border-b bg-muted/20">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
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
            totalPages={filteredData.length}
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 transition-none border-b">
              <TableHead className="w-16 text-center font-medium">
                No.
              </TableHead>
              <TableHead className="font-medium">ID</TableHead>
              <TableHead className="font-medium">Role</TableHead>

              <TableHead
                className="font-medium cursor-pointer select-none group"
                onClick={() =>
                  setSortConfig((prev) =>
                    prev?.key === "createdAt" && prev.direction === "asc"
                      ? { key: "createdAt", direction: "desc" }
                      : { key: "createdAt", direction: "asc" },
                  )
                }
              >
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Date Created
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

              <TableHead className="text-start font-medium hidden md:table-cell">
                Date Updated
              </TableHead>
              <TableHead className="text-right pr-6 font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p>No roles found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((role, index) => (
                <TableRow
                  key={role.id}
                  className="group hover:bg-muted/30 transition-colors cursor-default"
                >
                  <TableCell className="text-center text-muted-foreground text-sm">
                    {(page - 1) * limit + index + 1}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      {role.id}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium border ${
                        role.role === "Admin"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
                          : role.role === "User"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                    >
                      {role.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {role.createdAt
                      ? new Date(role.createdAt).toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                    {role.updatedAt
                      ? new Date(role.updatedAt).toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </TableCell>

                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity md:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        onClick={() => handleSelectedRole(role)}
                        title="Edit Role"
                      >
                        <PencilLine className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        onClick={() => confirmDelete(role.id)}
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
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
          data={roleData}
          filteredData={filteredData}
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
