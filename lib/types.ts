import { LucideIcon } from "lucide-react";

export type NavLink = {
  name: string;
  icon: LucideIcon;
  href: string;
  roles?: string[];
  subMenu?: never;
};

export type NavSubMenu = {
  name: string;
  icon: LucideIcon;
  href?: never;
  subMenu: NavLink[];
  roles?: string[];
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
  id: string;
  role: string;
  created_at: string;
}
export interface User {
  created_at?: string;
  email: string;
  firstname: string;
  id: string;
  lastname: string;
  middlename?: string;
  password?: string;
  roles: RoleTypes;
  suffix?: string;
  name: string;
  username: string;
}

export interface Log {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  timestamp: string;
}
export interface CactiGraph {
  image: string;
  image_width: string;
  image_height: string;

  [key: string]: string | number;
}
export interface CactiDevice {
  description: string;
  hostname: string;
  id: string;
  graphs: string;
  dataSources: string;
  status: string;
  inState: string;
  uptime: string;
  pollTime: string;
  currentMs: string;
  averageMs: string;
  availability: string;
}
// SNMP
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
  index: number;
  inOctets: number;
  outOctets: number;
}

export interface InterfaceDiscovery {
  index: number;
  name: string;
}

export interface NetworkInterface {
  index: number;
  name: string;
  adminStatus: number;
  operStatus: number;
  speedMbps: number;
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
}
