import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { UserTypes } from "@/lib/types";
interface Props {
  selectedUser: UserTypes;
  openDrawer: boolean;
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}
export function DrawerNonModal({
  openDrawer,
  setOpenDrawer,
  selectedUser,
}: Props) {
  return (
    <Drawer
      open={openDrawer}
      onOpenChange={setOpenDrawer}
      swipeDirection="right"
    >
      <DrawerContent className="w-250 rounded-md!">
        <DrawerHeader>
          <DrawerTitle>User Information</DrawerTitle>
          <p>{selectedUser.firstname}</p>
        </DrawerHeader>
        <div className="flex-1 p-4">
          <div className="rounded-2xl bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:h-80 group-data-[swipe-axis=y]/drawer-popup:w-full" />
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button>Close</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
