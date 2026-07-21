"use client";

import { useState } from "react";
import UsersManagementTable from "@/components/table/UsersManagementTable";
import { DrawerNonModal } from "@/components/DrawerNonModal";
import { RoleTypes, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddUserFormModal } from "@/components/AddUserFormModal";
import RolesManagementTable from "@/components/table/RolesManagementTable";
import { AddRoleFormModal } from "@/components/AddRoleFormModal";

export default function UsersManagementPage() {
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [openUserForm, setOpenUserForm] = useState<boolean>(false);
  const [openRoleForm, setOpenRoleForm] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User>({
    created_at: "",
    email: "",
    firstname: "",
    id: "",
    lastname: "",
    middlename: "",
    roles: { id: "", role: "", created_at: "" },
    suffix: "",
    username: "",
    name: "",
  });
  const [selectedRole, setSelectedRole] = useState<RoleTypes>({
    id: "",
    role: "",
    created_at: "",
  });
  const mockUsers: User = [
    {
      id: 1,
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      created_at: new Date(),
      roles: { name: "Admin" },
      suffix: "Jr.",
    },
    {
      id: 2,
      firstname: "Jane",
      lastname: "Smith",
      email: "jane@example.com",
      created_at: new Date(),
      roles: { name: "User" },
      suffix: "Jr.",
    },
  ];
  return (
    <div className="flex flex-col justify-center gap-10 font-lexend">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button
          className="cursor-pointer font-lexend"
          onClick={() => setOpenUserForm(true)}
        >
          <Plus className="shrink-0 w-5 h-5" />
          Create User
        </Button>
        <UsersManagementTable
          users={mockUsers}
          setSelectedUser={setSelectedUser}
          setOpenDrawer={setOpenDrawer}
        />
        {/* View User Information */}
        <DrawerNonModal
          selectedUser={selectedUser}
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
        />
        {/* User Form Modal */}
        <AddUserFormModal
          openUserForm={openUserForm}
          setOpenUserForm={setOpenUserForm}
        />
      </div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Button
          className="cursor-pointer font-lexend!"
          onClick={() => setOpenRoleForm(true)}
        >
          <Plus className="shrink-0 w-5 h-5" />
          Create Role
        </Button>
        <RolesManagementTable
          users={mockUsers}
          setSelectedRole={setSelectedRole}
          setOpenDrawer={setOpenDrawer}
        />
        {/* View User Information */}
        {/* <DrawerNonModal
          selectedUser={selectedUser}
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
        /> */}
        {/* User Form Modal */}
        <AddRoleFormModal
          openRoleForm={openRoleForm}
          setOpenRoleForm={setOpenRoleForm}
        />
      </div>
    </div>
  );
}
