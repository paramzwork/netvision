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

export interface User {
  email: string;
  id: string;
  name: string;
  password: string;
  role: string;
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

export interface InterfaceInfo {
  index: number;
  name: string;
  speed: number;
}

export interface InterfaceTraffic {
  index: number;
  inOctets: bigint;
  outOctets: bigint;
}
