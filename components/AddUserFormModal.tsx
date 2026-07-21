import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddUserForm from "./AddUserForm";
interface Props {
  openUserForm: boolean;
  setOpenUserForm: React.Dispatch<React.SetStateAction<boolean>>;
}
export function AddUserFormModal({ openUserForm, setOpenUserForm }: Props) {
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
          <AddUserForm />
        </div>
        {/* <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
