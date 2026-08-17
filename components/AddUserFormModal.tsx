import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddUserForm from "./AddUserForm";
import { RoleTypes, UserTypes } from "@/lib/types";
interface Props {
  userFormType: string;
  openUserForm: boolean;
  roleData: RoleTypes[];
  setOpenUserForm: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUser: UserTypes | null;
}
export function AddUserFormModal({
  openUserForm,
  roleData,
  setOpenUserForm,
  userFormType,
  selectedUser,
}: Props) {
  return (
    <Drawer
      open={openUserForm}
      onOpenChange={setOpenUserForm}
      swipeDirection="right"
    >
      <DrawerContent className="fixed inset-y-0 right-0 left-auto mt-0 flex h-full w-full flex-col rounded-none sm:w-112.5 md:w-250 sm:rounded-l-2xl border-l bg-background shadow-2xl outline-none">
        {/* HEADER SECTION */}
        <div className="border-b px-6 py-5">
          <DrawerHeader className="p-0 text-left">
            <DrawerTitle className="text-lg font-semibold tracking-tight font-lexend">
              {userFormType === "create"
                ? "Create New User"
                : "Edit User Profile"}
            </DrawerTitle>
            {/* Optional but recommended: Adds context to the action */}
            <DrawerDescription className="text-sm text-muted-foreground mt-1.5 font-lexend">
              {userFormType === "create"
                ? "Add a new user to the system and assign their role."
                : "Update this user's personal information and permissions."}
            </DrawerDescription>
          </DrawerHeader>
        </div>

        {/* BODY SECTION (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <AddUserForm
            data={selectedUser}
            roleData={roleData}
            setOpenUserForm={setOpenUserForm}
            userFormType={userFormType}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
