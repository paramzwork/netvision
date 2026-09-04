import { RoleTypes, UserLog, UserTypes } from "@/lib/types";
import { create } from "zustand";

interface UserStore {
  users: UserTypes[];
  addUsers: (users: UserTypes[]) => void;
  setUsers: React.Dispatch<React.SetStateAction<UserTypes[]>>;
  selectedUser: UserTypes | null;
  setSelectedUser: (user: UserTypes | null) => void;
}
export const useUserStore = create<UserStore>((set) => ({
  users: [],
  addUsers: (newUsers) =>
    set((state) => {
      const existingIds = new Set(state.users.map((user) => user.id));

      const uniqueUsers = newUsers.filter((user) => !existingIds.has(user.id));

      return {
        users: [...state.users, ...uniqueUsers],
      };
    }),
  setUsers: (value) =>
    set((state) => ({
      users: typeof value === "function" ? value(state.users) : value,
    })),

  selectedUser: null,
  setSelectedUser: (user) =>
    set({
      selectedUser: user,
    }),
}));

interface RoleStore {
  roles: RoleTypes[];
  rolesByPage: Record<number, RoleTypes[]>;
  setRolesPage: (page: number, users: RoleTypes[]) => void;
  setRoles: React.Dispatch<React.SetStateAction<RoleTypes[]>>;
}

export const useRoleStore = create<RoleStore>((set) => ({
  roles: [],
  rolesByPage: {},
  setRolesPage: (page, roles) =>
    set((state) => ({
      rolesByPage: {
        ...state.rolesByPage,
        [page]: roles,
      },
      roles,
    })),
  setRoles: (value) =>
    set((state) => ({
      roles: typeof value === "function" ? value(state.roles) : value,
    })),
}));
// USER LOGS _________________________________________________________________
interface UserLogsStore {
  userLogs: UserLog[];
  total: number;

  setUserLogs: React.Dispatch<React.SetStateAction<UserLog[]>>;
  setTotal: (total: number) => void;
}

export const useUserLogsStore = create<UserLogsStore>((set) => ({
  userLogs: [],
  total: 0,

  setUserLogs: (value) =>
    set((state) => ({
      userLogs: typeof value === "function" ? value(state.userLogs) : value,
    })),

  setTotal: (total) => set({ total }),
}));
