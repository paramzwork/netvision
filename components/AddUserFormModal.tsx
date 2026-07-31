import {
  Drawer,
  DrawerContent,
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
      <DrawerContent className="w-250 rounded-l-md!">
        <DrawerHeader>
          <DrawerTitle>
            {userFormType === "create" ? "Create" : "Update"} New User
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 p-4">
          <AddUserForm
            data={selectedUser}
            roleData={roleData}
            setOpenUserForm={setOpenUserForm}
            userFormType={userFormType}
          />
        </div>
        {/* <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
