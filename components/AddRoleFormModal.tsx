import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddRoleForm from "./AddRoleForm";
interface Props {
  openRoleForm: boolean;
  setOpenRoleForm: React.Dispatch<React.SetStateAction<boolean>>;
}
export function AddRoleFormModal({ openRoleForm, setOpenRoleForm }: Props) {
  return (
    <Drawer
      open={openRoleForm}
      onOpenChange={setOpenRoleForm}
      swipeDirection="right"
    >
      <DrawerContent className="w-250 rounded-l-md!">
        <DrawerHeader>
          <DrawerTitle>Create New Role</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 p-4">
          <AddRoleForm />
        </div>
        {/* <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
