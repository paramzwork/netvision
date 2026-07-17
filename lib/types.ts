// 1. Defined Interface (No 'any' allowed!)
export interface ConsumptionLog {
  cityId: string;
  cityName: string;
  contact: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
  deletedAt: string;
  email: string;
  id: string;
  identity: string;
  name: string;
  note: string;
  outerIdentity: string;
  password: string;
  phone: string;
  serviceAreaId: string;
  street: string;
}
export interface BandwidthUsage {
  up: number;
  down: number;
}

export interface BandwidthData {
  clientId: number;
  createdAt: string; // ISO date string
  id: number;
  subjectHour: string; // ISO date string
  terminalNodeId: number;

  jsonData: {
    [hour: string]: BandwidthUsage;
  };
}

export interface ChartPoint {
  time: string;
  up: number;
  down: number;
}

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

export interface ConsumptionItem {
  consumptionDay: string;
  up: string;
  down: string;
}

export interface TerminalNode {
  cityId: number;
  cityName: string;
  clientId: number;
  clientIdentifier: string;
  clientName: string;
  clientOuterIdentifier: string;
  comment: string | null;
  contact: string;
  contract: string;
  createdAt: string;
  createdById: number;
  createdByName: string;
  customVlanTaggingIptvId: number | null;
  customVlanTaggingNetId: number | null;
  deletedAt: string | null;
  deletedById: number | null;
  email: string;
  fixIp: string | null;
  hookedAt: string;
  hookedById: number;
  hookedByName: string;
  id: number;
  isFtth: boolean;
  isPppoe: boolean;
  isPppoeActive: boolean;
  language: string;
  mapDataId: number;
  mapDataName: string;
  modifiedAt: string;
  modifiedById: number;
  modifiedByName: string;
  name: string;
  number: number;
  numberExt: string;
  oltName: string;
  onuOltId: number;
  opticalDeviceId: number;
  outerIdentity: string | null;
  packageName: string;
  password: string;
  phone: string;
  radiusPassword: string | null;
  radiusUsername: string | null;
  rfEnabled: boolean;
  serialNumber: string;
  serviceAreaId: number | null;
  serviceAreaName: string | null;
  sipData: unknown | null;
  status: string;
  statusId: number;
  statusOperational: boolean;
  streetId: number;
  streetName: string;
  terminalNodeOltId: string;
  todoCount: number | null;
  todoTaskIds: unknown | null;
  tr069Enabled: boolean;
  voipProvider: string;
  voipProviderId: string;
  wifi: boolean;
}

export interface User {
  email: string;
  id: string;
  name: string;
  password: string;
  role: string;
  username: string;
}
export interface EnrichedTerminalNode extends TerminalNode {
  totalUp: number;
  totalDown: number;
}
export interface AnalyticsProps {
  topUpload: EnrichedTerminalNode[];
  topDownload: EnrichedTerminalNode[];
  upload95: number;
  download95: number;
}

export interface ConsumptionRequestBody {
  id: number;
  terminal_node_id: string;
  created_at: string;
  clientId: number;
  consumptionDay: string; // ISO date string
  up: string;
  down: string;
}
export interface Log {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  timestamp: string;
}