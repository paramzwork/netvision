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
import { ChevronDown, ChevronUp, PencilLine, Trash2 } from "lucide-react";
import { RoleTypes } from "@/lib/types";
import { useMemo, useState } from "react";
import Pagination from "../Pagination";
import { toast } from "sonner";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { tripleEncode } from "@/lib/utils";
import EntriesPerPage from "../EntriesPerPage";

interface Props {
  roleData: RoleTypes[];
  setSelectedRole: React.Dispatch<React.SetStateAction<RoleTypes | null>>;
  handleForm: (type: string) => void;
}

export default function RolesManagementTable({
  roleData,
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
    <div className="rounded-md border bg-background overflow-hidden">
      <input
        type="text"
        placeholder="Search..."
        className="w-full min-w-45 max-w-75 border border-slate-300 px-3 h-11 rounded-lg"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <EntriesPerPage
        limit={limit}
        setLimit={setLimit}
        setPage={setPage}
        totalPages={filteredData.length}
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-300 rounded-tr-2xl">
            <TableHead>No.</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead
              onClick={() =>
                setSortConfig((prev) =>
                  prev?.key === "createdAt" && prev.direction === "asc"
                    ? { key: "createdAt", direction: "desc" }
                    : { key: "createdAt", direction: "asc" },
                )
              }
            >
              <div className="flex flex-row items-center gap-2 cursor-pointer">
                Date Created
                {sortConfig?.key === "createdAt" ? (
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )
                ) : null}
              </div>
            </TableHead>

            <TableHead className="text-start">Date Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                No role found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((role, index) => (
              <TableRow key={role.id} className="odd:bg-muted/90">
                <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                <TableCell>{role.id}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${role.role === "Admin" ? "border-amber-400 bg-amber-400/40" : role.role === "User" ? "border-green-400 bg-green-400/40" : "border-red-400 bg-red-400/40"}`}
                  >
                    {role.role}
                  </Badge>
                </TableCell>

                <TableCell>
                  {role.createdAt
                    ? new Date(role.createdAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {role.updatedAt
                    ? new Date(role.updatedAt).toLocaleDateString()
                    : "—"}
                </TableCell>

                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleSelectedRole(role)}
                  >
                    <PencilLine className="w-5 h-5 shrink-0 text-amber-400" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => confirmDelete(role.id)}
                  >
                    <Trash2 className="w-5 h-5 shrink-0 text-red-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        setPage={setPage}
        limit={limit}
        data={roleData}
        filteredData={filteredData}
      />
      <ConfirmationDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
