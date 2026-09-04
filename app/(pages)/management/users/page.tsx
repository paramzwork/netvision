"use client";

import { useEffect, useState } from "react";
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
import Breadcrumbs from "@/components/Breadcrumbs";

export default function UsersManagement() {
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

  const { users, setUsers } = useUserStore();
  const { roles, setRoles } = useRoleStore();

  const handleRoleForm = async (type: string) => {
    setRoleFormType(type);
    setOpenRoleForm(true);
  };

  const [userPage, setUserPage] = useState<number>(1);
  const [userLimit, setUserLimit] = useState<string>("10");
  const [totalUsers, setTotalUsers] = useState<number>(0);

  const [rolePage, setRolePage] = useState<number>(1);
  const [roleLimit, setRoleLimit] = useState<string>("10");
  const [totalRoles, setTotalRoles] = useState<number>(0);
  // const fetchData = useCallback(async () => {
  //   if (Object.keys(users).length > 0) {
  //     return;
  //   }
  //   try {
  //     const [resUser, resRole] = await Promise.all([
  //       fetch(`/api/users?page=${userPage}&limit=${userLimit}`, {
  //         method: "GET",
  //       }),
  //       fetch(`/api/users/role?page=${rolePage}&limit=${roleLimit}`, {
  //         method: "GET",
  //       }),
  //     ]);
  //     const [resUData, resRData] = await Promise.all([
  //       resUser.json(),
  //       resRole.json(),
  //     ]);
  //     if (!resUser.ok || !resRole.ok) {
  //       if (resUser.status === 401) {
  //         router.replace("/");
  //         return;
  //       }
  //       toast.error(resUData.message);
  //       return;
  //     }
  //     if (!resUser.ok || !resRole.ok) {
  //       toast.error("Failed to load data.");
  //       return;
  //     }
  //     setUsers(resUData.data);
  //     setTotalUsers(resUData.total);
  //     setRoles(resRData);
  //   } catch {
  //     toast.error("Internal Server Error.", {
  //       description: "Server error please contact admin.",
  //     });
  //   }
  // }, [
  //   roleLimit,
  //   rolePage,
  //   router,
  //   setRoles,
  //   setUsers,
  //   userLimit,
  //   userPage,
  //   users,
  // ]);
  // useEffect(() => {
  //   if (hasMountedRef.current) return;
  //   hasMountedRef.current = true;
  //   fetchData();
  // }, [fetchData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `/api/users?page=${userPage}&limit=${userLimit}`,
        );

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/");
            return;
          }

          toast.error(data.message || "Failed to load users.");
          return;
        }

        setUsers(data.data);
        setTotalUsers(data.total);
      } catch {
        toast.error("Failed to load users.");
      }
    };

    fetchUsers();
  }, [userPage, userLimit, router, setUsers]);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(
          `/api/users/role?page=${rolePage}&limit=${roleLimit}`,
        );

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/");
            return;
          }

          toast.error(data.message || "Failed to load roles.");
          return;
        }

        setRoles(data.data);
        setTotalRoles(data.total);
      } catch {
        toast.error("Failed to load roles.");
      }
    };

    fetchRoles();
  }, [rolePage, roleLimit, router, setRoles]);
  return (
    <div className="flex flex-col justify-center gap-4 font-lexend">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Users Management",
            },
          ]}
        />
        <h1 className="text-lg font-bold">User Management</h1>
      </div>
      <div className="space-y-5">
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
          page={userPage}
          setPage={setUserPage}
          limit={userLimit}
          setLimit={setUserLimit}
          totalUsers={totalUsers}
        />
        {/* User Form Modal */}
        <AddUserFormModal
          userFormType={userFormType}
          selectedUser={selectedUser}
          roleData={roles}
          openUserForm={openUserForm}
          setOpenUserForm={setOpenUserForm}
          setUsers={setUsers}
          setSelectedUser={setSelectedUser}
        />
      </div>
      <div className="space-y-6">
        <h1 className="text-lg font-bold">Role Management</h1>
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
          page={rolePage}
          setPage={setRolePage}
          limit={roleLimit}
          setLimit={setRoleLimit}
          totalRoles={totalRoles}
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
