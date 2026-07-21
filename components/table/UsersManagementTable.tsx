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
import { MoreHorizontal } from "lucide-react";
import { User } from "@/lib/types";

interface Props {
  users: User[];
  setSelectedUser: React.Dispatch<React.SetStateAction<User>>;
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UsersManagementTable({
  users,
  setSelectedUser,
  setOpenDrawer,
}: Props) {
  const handleSelectedUser = async (value: User) => {
    setSelectedUser(value);
    setOpenDrawer(true);
  };
  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-300 rounded-tr-2xl">
            <TableHead>ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="odd:bg-muted/90">
                <TableCell>{user.id}</TableCell>

                <TableCell>
                  <p className="cursor-pointer hover:underline hover:underline-offset-1" onClick={() => handleSelectedUser(user)}>
                    {`${user.firstname ?? ""} ${user.middlename ?? ""} ${user.lastname ?? ""}`}
                  </p>
                </TableCell>

                <TableCell>{user.email}</TableCell>

                <TableCell>
                  <Badge variant="secondary">{user.roles?.role ?? "N/A"}</Badge>
                </TableCell>

                <TableCell>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "—"}
                </TableCell>

                <TableCell className="text-right">
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
