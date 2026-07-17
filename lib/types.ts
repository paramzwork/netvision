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