import { RoleTypes, UserTypes } from "@/lib/types";
import { create } from "zustand";

interface UserStore {
  users: UserTypes[];
  setUsers: React.Dispatch<React.SetStateAction<UserTypes[]>>;
  selectedUser: UserTypes | null;
  setSelectedUser: (user: UserTypes | null) => void;
}
export const useUserStore = create<UserStore>((set) => ({
  users: [],
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
  setRoles: React.Dispatch<React.SetStateAction<RoleTypes[]>>;
}

export const useRoleStore = create<RoleStore>((set) => ({
  roles: [],
  setRoles: (value) =>
    set((state) => ({
      roles: typeof value === "function" ? value(state.roles) : value,
    })),
}));
