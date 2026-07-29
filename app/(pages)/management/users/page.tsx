"use client";

import { useEffect, useRef, useState } from "react";
import UsersManagementTable from "@/components/table/UsersManagementTable";
import { DrawerNonModal } from "@/components/DrawerNonModal";
import { RoleTypes, UserTypes } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddUserFormModal } from "@/components/AddUserFormModal";
import RolesManagementTable from "@/components/table/RolesManagementTable";
import { AddRoleFormModal } from "@/components/AddRoleFormModal";
import { toast } from "sonner";

export default function UsersManagementPage() {
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [openUserForm, setOpenUserForm] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserTypes>({
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "",
    firstname: "",
    id: 0,
    lastname: "",
    middlename: "",
    roles: { id: 0, role: "", createdAt: new Date(), updatedAt: new Date() },
    suffix: "",
    username: "",
  });

  const [roleData, setRoleData] = useState<RoleTypes[]>([]);
  const [openRoleForm, setOpenRoleForm] = useState<boolean>(false);
  const [roleFormType, setRoleFormType] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RoleTypes | null>(null);
  const hasMountedRef = useRef<boolean>(false);

  const handleRoleForm = async (type: string) => {
    setRoleFormType(type);
    setOpenRoleForm(true);
  };
  const fetchData = async () => {
    try {
      const res = await fetch("/api/users/role", { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to load data.");
        return;
      }
      setRoleData(data);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  useEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;
    fetchData();
  });
  const mockUsers: UserTypes[] = [
    {
      id: 1,
      username: "johndoe",
      firstname: "John",
      middlename: "",
      lastname: "Doe",
      email: "john@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: {
        id: 2,
        role: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      suffix: "Jr.",
    },
    {
      id: 2,
      username: "johndoe",
      firstname: "Jane",
      middlename: "",
      lastname: "Smith",
      email: "jane@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: {
        id: 2,
        role: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
          roleData={roleData}
          openUserForm={openUserForm}
          setOpenUserForm={setOpenUserForm}
        />
      </div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Button
          className="cursor-pointer font-lexend!"
          onClick={() => handleRoleForm("create")}
        >
          <Plus className="shrink-0 w-5 h-5" />
          Create Role
        </Button>
        <RolesManagementTable
          roleData={roleData}
          setSelectedRole={setSelectedRole}
          handleForm={handleRoleForm}
        />
        {/* Role Form Modal */}
        <AddRoleFormModal
          roleFormType={roleFormType}
          selectedRole={selectedRole}
          openRoleForm={openRoleForm}
          setOpenRoleForm={setOpenRoleForm}
          setRoleData={setRoleData}
        />
      </div>
    </div>
  );
}
