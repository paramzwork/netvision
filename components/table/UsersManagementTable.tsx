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
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import { UserTypes } from "@/lib/types";
import { toast } from "sonner";
import Pagination from "../Pagination";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { useMemo, useState } from "react";
import { tripleEncode } from "@/lib/utils";
import EntriesPerPage from "../EntriesPerPage";
import { useRouter } from "next/navigation";

interface Props {
  users: UserTypes[];
  setUserData: React.Dispatch<React.SetStateAction<UserTypes[]>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserTypes | null>>;
  setUserFormType: React.Dispatch<React.SetStateAction<string>>;
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;

  page: number;
  limit: string;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setLimit: React.Dispatch<React.SetStateAction<string>>;
  totalUsers: number;
}

export default function UsersManagementTable({
  users,
  setUserData,
  setSelectedUser,
  setOpenDrawer,
  setUserFormType,

  page,
  limit,
  setPage,
  setLimit,
  totalUsers,
}: Props) {
  const handleSelectedUser = async (value: UserTypes) => {
    setSelectedUser(value);
    setUserFormType("edit");
    setOpenDrawer(true);
  };
  const [search, setSearch] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const [selectedID, setSelectedID] = useState<number>();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const router = useRouter();

  // 🔍 Filtered data
  const filteredData = useMemo(() => {
    return users.filter((item) => {
      const matchSearch = `${item.firstname} ${item.roles.role}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchSearch;
    });
  }, [users, search]);
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
      sortConfig.key as keyof UserTypes,
      sortConfig.direction,
    );
  }, [filteredData, sortConfig]);

  const paginatedData = sortedData;
  const handleDelete = async () => {
    if (!selectedID) return;
    const toastID = toast.loading("Deleting...");
    const id = tripleEncode(String(selectedID));
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        setConfirmDialog(false);
        toast.error(resData.message, { id: toastID });
        return;
      }
      setConfirmDialog(false);
      setUserData((prev) => prev.filter((role) => role.id !== selectedID));
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

      {/* TABLE SECTION */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 transition-none border-b">
              <TableHead className="w-16 text-center font-medium">No</TableHead>

              <TableHead
                className="font-medium cursor-pointer select-none group"
                onClick={() =>
                  setSortConfig((prev) =>
                    prev?.key === "firstname" && prev.direction === "asc"
                      ? { key: "firstname", direction: "desc" }
                      : { key: "firstname", direction: "asc" },
                  )
                }
              >
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  User Details
                  {sortConfig?.key === "firstname" ? (
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

              <TableHead className="font-medium">Role</TableHead>

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

              <TableHead className="text-right pr-6 font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p>No users found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((user, index) => (
                <TableRow
                  key={`${index}-${user.id}`}
                  className="group hover:bg-muted/30 transition-colors cursor-default"
                >
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {(page - 1) * Number(limit) + index + 1}
                  </TableCell>

                  {/* Combined Name and Email for better hierarchy */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-xs cursor-pointer hover:text-primary transition-colors">
                        {`${user.firstname ?? ""} ${user.lastname ?? ""}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium text-xs border ${
                        user.roles?.role === "Admin"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
                          : user.roles?.role === "User"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                    >
                      {user.roles?.role ?? "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-CA", {
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
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer"
                        onClick={() => handleSelectedUser(user)}
                        title="Edit User"
                      >
                        <PencilLine className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        onClick={() => confirmDelete(user.id)}
                        title="Delete User"
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
          data={users}
          filteredData={filteredData}
          total={totalUsers}
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
