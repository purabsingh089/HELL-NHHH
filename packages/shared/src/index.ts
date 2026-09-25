export type TestStatus = "DRAFT" | "READY" | "ACTIVE" | "PAUSED" | "STOPPED" | "COMPLETED" | "FAILED";
export type WorkerStatus = "ONLINE" | "BUSY" | "IDLE" | "DRAINING" | "OFFLINE" | "ERROR";

export interface ServerTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  version: string;
  connectionMethod: string;
  authorized: boolean;
}

export interface DrainEvent {
  timestamp: string;
  message: string;
  level?: "INFO" | "WARN" | "ERROR";
}

export interface MetricPoint {
  timestamp: string;
  tps: number;
  mspt: number;
  latency: number;
  errors: number;
  connected: number;
}

export interface TestDefinition {
  id: string;
  name: string;
  targetId: string;
  status: TestStatus;
  population: number;
  rampPerInterval: number;
  intervalSeconds: number;
  durationMinutes: number;
  scenario: string;
  workers: string[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  metrics: MetricPoint[];
  events: DrainEvent[];
}

export interface WorkerRecord {
  id: string;
  status: WorkerStatus;
  cpu: number;
  ram: number;
  botCount: number;
  capacity: number;
  version: string;
  uptime: number;
  currentTest?: string;
}

export interface DashboardSummary {
  activeTests: number;
  activeBots: number;
  connectedWorkers: number;
  totalWorkers: number;
  totalTargets: number;
  testsToday: number;
  failedTests: number;
  averageDurationMinutes: number;
}
