import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  onConfirm: () => void;
  confirmDialog: boolean;
  setConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
}
export function ConfirmationDialog({
  onConfirm,
  confirmDialog,
  setConfirmDialog,
}: Props) {
  return (
    <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
      {/* <AlertDialogTrigger render={<Button variant="outline">Show Dialog</Button>} /> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
