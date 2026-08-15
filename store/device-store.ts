import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
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

interface DevicesStore {
  device: DeviceInfoTypes[];
  setDevice: React.Dispatch<React.SetStateAction<DeviceInfoTypes[]>>;
  selectedDevice: DeviceInfoTypes | null;
  setSelectedDevice: (user: DeviceInfoTypes | null) => void;
}

export const useDevicesStore = create<DevicesStore>((set) => ({
  device: [],

  selectedDevice: null,

  setDevice: (value) =>
    set((state) => ({
      device: typeof value === "function" ? value(state.device) : value,
    })),
  setSelectedDevice: (device) =>
    set({
      selectedDevice: device,
    }),
}));

interface InterfaceStore {
  interfaces: Record<string, InterfaceTypes[]>;

  setInterfaces: (
    ip: string,
    interfaces:
      | InterfaceTypes[]
      | ((prev: InterfaceTypes[]) => InterfaceTypes[]),
  ) => void;
  getInterfaces: (ipAddress: string) => InterfaceTypes[];

  clearInterfaces: () => void;
}

export const useInterfaceStore = create<InterfaceStore>((set, get) => ({
  interfaces: {},

  setInterfaces: (ip, value) =>
    set((state) => ({
      interfaces: {
        ...state.interfaces,
        [ip]:
          typeof value === "function"
            ? value(state.interfaces[ip] ?? [])
            : value,
      },
    })),

  getInterfaces: (ipAddress) => get().interfaces[ipAddress] ?? [],

  clearInterfaces: () => set({ interfaces: {} }),
}));

interface InterfacesWeatherMap {
  interfaces: InterfaceTypes[];

  setInterfaces: React.Dispatch<React.SetStateAction<InterfaceTypes[]>>;

  selectedDevice: InterfaceTypes | null;

  setSelectedDevice: (device: InterfaceTypes | null) => void;
}

export const useInterfacesWeathermap = create<InterfacesWeatherMap>((set) => ({
  interfaces: [],

  selectedDevice: null,

  setInterfaces: (value) =>
    set((state) => ({
      interfaces: typeof value === "function" ? value(state.interfaces) : value,
    })),

  setSelectedDevice: (device) =>
    set({
      selectedDevice: device,
    }),
}));
