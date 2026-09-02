import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopologyTypes } from "@/app/(pages)/weathermap/page";
import { Search, Trash2 } from "lucide-react";
import { TooltipComponent } from "../TooltipComponent";
import { tripleEncode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { useData } from "@/context/DataContext";
interface OverviewWeathermapTableProps {
  topologies: TopologyTypes[];
  setTopologies: React.Dispatch<React.SetStateAction<TopologyTypes[]>>;
}
export default function OverviewWeathermapTable({
  topologies,
  setTopologies,
}: OverviewWeathermapTableProps) {
  const { currentUser } = useData();
  const router = useRouter();
  // number
  const [selectedID, setSelectedID] = useState<number>();
  // boolean
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);

  const handleDelete = async () => {
    if (!selectedID) return;
    const toastID = toast.loading("Deleting...");
    const id = tripleEncode(String(selectedID));
    try {
      const res = await fetch(`/api/topology/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();

      if (!res.ok) {
        setConfirmDialog(false);
        toast.error(resData.message, { id: toastID });
        return;
      }
      setConfirmDialog(false);
      setTopologies((prev) => prev.filter((w) => w.id !== selectedID));
      toast.success(resData.message, { id: toastID });
    } catch {
      setConfirmDialog(false);
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedID(id);
    setConfirmDialog(true);
  };
  return (
    <div className="font-lexend border rounded-xl shadow-sm bg-background overflow-hidden">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="text-base font-semibold">Discovered Weathermaps</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {topologies.length} weathermaps found
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className="font-lexend">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Description</TableHead>
              {(currentUser.roles.role.toLowerCase() === "admin" ||
                currentUser.roles.role.toLowerCase() === "super admin") && (
                <TableHead className="font-medium text-center">...</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {topologies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p>No devices discovered.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              topologies.map((dev, index) => (
                <TableRow
                  key={index}
                  className="group text-xs text-muted-foreground hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <TableCell
                    className="font-mono"
                    onClick={() => {
                      const id = tripleEncode(String(dev.id));
                      router.push(`/weathermap/${id}`);
                    }}
                  >
                    <p className="text-sky-500 hover:underline">{dev.name}</p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <TooltipComponent value={dev.description}>
                      <div className="max-w-md truncate cursor-pointer">
                        {dev.description}
                      </div>
                    </TooltipComponent>
                  </TableCell>
                  {(currentUser.roles.role.toLowerCase() === "admin" ||
                    currentUser.roles.role.toLowerCase() === "super admin") && (
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        onClick={() => confirmDelete(dev.id)}
                        title="Delete Weathermap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmationDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}
