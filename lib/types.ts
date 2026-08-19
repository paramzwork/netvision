import { LucideIcon } from "lucide-react";

export type NavLink = {
  name: string;
  icon: LucideIcon;
  href: string;
  roles?: string[];
};

export type MenuItemTypes = {
  name: string;
  icon: LucideIcon;
  href?: string;
  subMenu?: NavLink[];
  roles?: string[];
  dynamicDevices?: boolean;
};
export interface DailyConsumption {
  clientName: string;
  consumptionDay: string;
  createdAt: string;
  down: string;
  id: number;
  terminalNodeId: number;
  up: string;
}
export interface ConsumptionGroupedByClient {
  clientId: number;
  data: DailyConsumption[];
}
export interface ChartData {
  day: string;
  up: number;
  down: number;
}
export interface RoleTypes {
  id: number;
  role: string;
  createdAt: Date;
  updatedAt: Date | null;
}
export interface UserTypes {
  id: number;
  username: string;
  email: string | null;
  firstname: string | null;
  password: string | null;
  lastname: string | null;
  suffix?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  roles: RoleTypes;
}
export interface Log {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  timestamp: string;
}
// SNMP

export interface DeviceInfoTypes {
  id: string;
  sysContact: string;
  sysDescr: string;
  sysLocation: string;
  sysName: string;
  sysObjectID: string;
  uptime: string;
  pollTime: string;
  currentMs: string;
  ipAddress: string;
  community: string;
  status: string;
  interfaceCount: string;
  interfaces: InterfaceTypes[];
  handles: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface SnmpResult {
  oid: string;
  value: string;
  type: number;
}
export interface SnmpData {
  hostname: string;
  description: string;
  uptime: string;
  contact: string;
  location: string;
}

export interface SnmpConfig {
  host: string;
  community: string;
  port?: number;
  version?: number;
}

export interface SnmpVarbind {
  oid: string;
  type: number;
  value: string | number | bigint | Buffer;
}

export interface InterfaceTraffic {
  interfaceId: number;
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
}

export interface InterfaceTypes {
  id: number;
  index: number;
  deviceId: number;
  deviceIp?: string;
  name: string;
  description: string;
  adminStatus: number;
  operStatus: number;
  status: string;
  speedMbps: number;
  handles: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  statistics: InterfaceStatistic[];
}
export interface InterfaceStatistic {
  id: number;
  interfaceId: number;
  inOctets: string;
  outOctets: string;
  inErrors: number;
  outErrors: number;
  createdAt: string;
}

export interface InterfaceResponse {
  id: number;
  name: string;
  index: number;
  speedMbps: number;
  adminStatus: number;
  operStatus: number;
  description: string;
  statistics: InterfaceStatistic[];
}
export interface InterfaceDiscovery {
  index: number;
  name: string;
}

export interface NetworkInterfaces {
  index: number;
  name: string;
  description: string;
  adminStatus: number;
  operStatus: number;
  speedMbps: number;
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
}
/* ============================= */
/* GRAPH TYPES */
/* ============================= */

export type GraphType = "stacked" | "percent" | "lines" | "grid" | "sankey";

// Matches the accent colors already used across the dashboard
// (sky = Core Router / HTTP-HTTPS, indigo/violet = Edge Switch / DNS,
// emerald = SSH, amber = SNMP, red = alerts, plus a few more in the
// same family for interfaces beyond the first five).

export type DataPoint = { timestamp: number } & Record<string, number | string>;
