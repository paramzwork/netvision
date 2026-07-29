import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddRoleForm from "./AddRoleForm";
import { RoleTypes } from "@/lib/types";
interface Props {
  openRoleForm: boolean;
  selectedRole: RoleTypes | null;
  setOpenRoleForm: React.Dispatch<React.SetStateAction<boolean>>;
  setRoleData: React.Dispatch<React.SetStateAction<RoleTypes[]>>;
  roleFormType: string;
}
export function AddRoleFormModal({
  openRoleForm,
  roleFormType,
  setOpenRoleForm,
  selectedRole,
  setRoleData,
}: Props) {
  return (
    <Drawer
      open={openRoleForm}
      onOpenChange={setOpenRoleForm}
      swipeDirection="right"
    >
      <DrawerContent className="w-250 rounded-l-md!">
        <DrawerHeader>
          <DrawerTitle>
            {roleFormType === "create" ? "Create" : "Update"} New Role
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 p-4">
          <AddRoleForm
            type={roleFormType}
            data={selectedRole}
            setOpenRoleForm={setOpenRoleForm}
            setData={setRoleData}
          />
        </div>
        {/* <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
