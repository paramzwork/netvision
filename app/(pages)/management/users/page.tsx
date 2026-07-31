"use client";

import { useEffect, useRef, useState } from "react";
import UsersManagementTable from "@/components/table/UsersManagementTable";
import { RoleTypes, UserTypes } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddUserFormModal } from "@/components/AddUserFormModal";
import RolesManagementTable from "@/components/table/RolesManagementTable";
import { AddRoleFormModal } from "@/components/AddRoleFormModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRoleStore, useUserStore } from "@/store/user-store";

export default function UsersManagementPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserTypes | null>(null);
  const [userFormType, setUserFormType] = useState<string>("");
  const [openUserForm, setOpenUserForm] = useState<boolean>(false);
  const handleUserForm = async (type: string) => {
    setUserFormType(type);
    setOpenUserForm(true);
  };
  const [openRoleForm, setOpenRoleForm] = useState<boolean>(false);
  const [roleFormType, setRoleFormType] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RoleTypes | null>(null);
  const hasMountedRef = useRef<boolean>(false);
  const { users, setUsers } = useUserStore();
  const { roles, setRoles } = useRoleStore();
  const handleRoleForm = async (type: string) => {
    setRoleFormType(type);
    setOpenRoleForm(true);
  };
  const fetchData = async () => {
    if (Object.keys(users).length > 0) {
      return;
    }
    try {
      const [resUser, resRole] = await Promise.all([
        fetch("/api/users", { method: "GET" }),
        fetch("/api/users/role", { method: "GET" }),
      ]);
      const [resUData, resRData] = await Promise.all([
        resUser.json(),
        resRole.json(),
      ]);
      if (!resUser.ok || !resRole.ok) {
        if (resUser.status === 401) {
          router.replace("/");
          return;
        }
        toast.error(resUData.message);
        return;
      }
      if (!resUser.ok || !resRole.ok) {
        toast.error("Failed to load data.");
        return;
      }
      setUsers(resUData);
      setRoles(resRData);
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

  return (
    <div className="flex flex-col justify-center gap-10 font-lexend">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button
          className="cursor-pointer font-lexend"
          onClick={() => handleUserForm("create")}
        >
          <Plus className="shrink-0 w-5 h-5" />
          Create User
        </Button>
        <UsersManagementTable
          users={users}
          setUserData={setUsers}
          setSelectedUser={setSelectedUser}
          setOpenDrawer={setOpenUserForm}
          setUserFormType={setUserFormType}
        />
        {/* User Form Modal */}
        <AddUserFormModal
          userFormType={userFormType}
          selectedUser={selectedUser}
          roleData={roles}
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
          roleData={roles}
          setRoleData={setRoles}
          setSelectedRole={setSelectedRole}
          handleForm={handleRoleForm}
        />
        {/* Role Form Modal */}
        <AddRoleFormModal
          roleFormType={roleFormType}
          selectedRole={selectedRole}
          openRoleForm={openRoleForm}
          setOpenRoleForm={setOpenRoleForm}
          setRoleData={setRoles}
        />
      </div>
    </div>
  );
}
