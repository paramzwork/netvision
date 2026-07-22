export interface NetworkInterface {
  name: string;
  inbound: {
    current: number;
    average: number;
    max: number;
  };
  outbound: {
    current: number;
    average: number;
    max: number;
  };
}

// Alias used by DeviceTable
export type InterfaceMetric = NetworkInterface;

export const interfaces: NetworkInterface[] = [
  {
    name: "eth0",
    inbound: { current: 4.2, average: 3.8, max: 7.5 },
    outbound: { current: 2.1, average: 1.9, max: 4.2 },
  },
  {
    name: "eth1",
    inbound: { current: 3.1, average: 2.7, max: 6.0 },
    outbound: { current: 1.8, average: 1.5, max: 3.8 },
  },
  {
    name: "eth2",
    inbound: { current: 2.5, average: 2.2, max: 5.1 },
    outbound: { current: 1.4, average: 1.2, max: 3.0 },
  },
  {
    name: "eth3",
    inbound: { current: 1.9, average: 1.6, max: 4.0 },
    outbound: { current: 0.9, average: 0.8, max: 2.1 },
  },
  {
    name: "bond0",
    inbound: { current: 5.8, average: 5.1, max: 9.2 },
    outbound: { current: 3.3, average: 2.9, max: 6.5 },
  },
  {
    name: "bond1",
    inbound: { current: 1.2, average: 1.0, max: 2.8 },
    outbound: { current: 0.6, average: 0.5, max: 1.5 },
  },
  {
    name: "vlan10",
    inbound: { current: 3.7, average: 3.2, max: 6.8 },
    outbound: { current: 2.4, average: 2.1, max: 5.0 },
  },
  {
    name: "vlan20",
    inbound: { current: 2.8, average: 2.4, max: 5.5 },
    outbound: { current: 1.6, average: 1.4, max: 3.5 },
  },
  {
    name: "lo",
    inbound: { current: 0.4, average: 0.3, max: 1.0 },
    outbound: { current: 0.4, average: 0.3, max: 1.0 },
  },
  {
    name: "tun0",
    inbound: { current: 1.5, average: 1.3, max: 3.2 },
    outbound: { current: 0.8, average: 0.7, max: 2.0 },
  },
];

// Keep baseInterfaces as alias for backward compatibility
export const baseInterfaces = interfaces;
