import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddUserForm from "./AddUserForm";
import { RoleTypes } from "@/lib/types";
interface Props {
  openUserForm: boolean;
  roleData: RoleTypes[];
  setOpenUserForm: React.Dispatch<React.SetStateAction<boolean>>;
}
export function AddUserFormModal({
  openUserForm,
  roleData,
  setOpenUserForm,
}: Props) {
  return (
    <Drawer
      open={openUserForm}
      onOpenChange={setOpenUserForm}
      swipeDirection="right"
    >
      <DrawerContent className="w-250 rounded-l-md!">
        <DrawerHeader>
          <DrawerTitle>Create New User</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 p-4">
          <AddUserForm roleData={roleData} setOpenUserForm={setOpenUserForm} />
        </div>
        {/* <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
