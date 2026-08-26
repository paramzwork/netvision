"use client";

import { TopologyEdge, TopologyEdgeData } from "./WeatherMapComponent";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface EdgeSettingsProps {
  open: boolean;
  edge: TopologyEdge | null;
  onClose: () => void;
  onSave: (data: TopologyEdgeData) => void;

  swapTraffic: boolean;
  setSwapTraffic: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EdgeSettings({
  open,
  edge,
  onClose,
  onSave,
  swapTraffic,
  setSwapTraffic,
}: EdgeSettingsProps) {
  if (!edge) return null;

  const handleSave = () => {
    if (!edge) return;

    onSave({
      sourceInterfaceId: edge.data?.sourceInterfaceId ?? 0,
      sourceInterfaceName: edge.data?.sourceInterfaceName ?? "",

      targetInterfaceId: edge.data?.targetInterfaceId ?? 0,
      targetInterfaceName: edge.data?.targetInterfaceName ?? "",

      sourceDesc: edge.data?.sourceDesc ?? "",
      targetDesc: edge.data?.targetDesc ?? "",

      inbound: edge.data?.inbound ?? 0,
      outbound: edge.data?.outbound ?? 0,

      swapTraffic,

      sourceAdminStatus: edge.data?.sourceAdminStatus ?? 0,
      sourceOperStatus: edge.data?.sourceOperStatus ?? 0,
      sourceStatus: edge.data?.sourceStatus ?? "",

      targetAdminStatus: edge.data?.targetAdminStatus ?? 0,
      targetOperStatus: edge.data?.targetOperStatus ?? 0,
      targetStatus: edge.data?.targetStatus ?? "",

      trafficHistory: edge.data?.trafficHistory ?? [],
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Connection information */}
          <div className="rounded-lg border p-3 space-y-3">
            <div>
              <Label>Source Interface</Label>

              <Input disabled value={edge.data?.sourceInterfaceName ?? ""} />
            </div>

            <div>
              <Label>Target Interface</Label>

              <Input disabled value={edge.data?.targetInterfaceName ?? ""} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label>Swap Traffic Display</Label>

              <p className="text-xs text-muted-foreground">
                Swap the displayed inbound and outbound values.
              </p>
            </div>

            <Switch checked={swapTraffic} onCheckedChange={setSwapTraffic} />
          </div>
          {/* Bandwidth */}
          {/* <div>
            <Label>Bandwidth (Mbps)</Label>

            <Input
              type="number"
              min={0}
              value={bandwidthMbps}
              onChange={(e) => setBandwidthMbps(Number(e.target.value))}
            />
          </div> */}
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
