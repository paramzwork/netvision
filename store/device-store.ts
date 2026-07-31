import { DeviceInfoTypes } from "@/lib/types";
import { create } from "zustand";

export interface Device {
  ipAddress: string;
  sysName: string;
  status: string;
}

interface DeviceStore {
  devices: Record<string, DeviceInfoTypes>;

  selectedDevice: DeviceInfoTypes | null;

  setDevice: (id: string, device: DeviceInfoTypes) => void;
  setSelectedDevice: (device: DeviceInfoTypes | null) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: {},

  selectedDevice: null,

  setDevice: (id, device) =>
    set((state) => ({
      devices: {
        ...state.devices,
        [id]: device,
      },
    })),
  setSelectedDevice: (device) =>
    set({
      selectedDevice: device,
    }),
}));
