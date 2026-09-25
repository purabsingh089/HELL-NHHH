// User & Auth
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
}

// Servers
export interface ServerTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  minecraftVersion: string;
  serverType?: string;
  connectionMethod: string;
  authorized: boolean;
  tags?: string[];
  notes?: string;
  createdAt: string;
}

export interface CreateServerRequest {
  name: string;
  host: string;
  port: number;
  minecraftVersion: string;
  serverType?: string;
  connectionMethod?: string;
  authorized: boolean;
}

// Scenarios
export interface ScenarioNode {
  id: string;
  type: string;
  params?: Record<string, any>;
  children?: ScenarioNode[];
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  version: number;
  definition: ScenarioNode;
  isTemplate: boolean;
  createdAt: string;
}

export type ScenarioType =
  | 'LoginStress'
  | 'ReconnectStorm'
  | 'MovementLoad'
  | 'ChunkExploration'
  | 'Survival'
  | 'PvP'
  | 'Mining'
  | 'EntityLoad'
  | 'MixedRealistic';

// Bot Profiles
export interface BotProfile {
  id: string;
  name: string;
  description?: string;
  behavior: Record<string, number>;
  createdAt: string;
}

// Tests
export type TestStatus =
  | 'DRAFT'
  | 'READY'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'STOPPED'
  | 'COMPLETED'
  | 'FAILED';

export interface Test {
  id: string;
  testNumber: number;
  name: string;
  serverId: string;
  status: TestStatus;
  scenarioId: string;
  botPopulation: number;
  startingPopulation: number;
  rampPerInterval: number;
  intervalSeconds: number;
  maxDurationMinutes: number;
  reconnectBehavior: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestRequest {
  name: string;
  serverId: string;
  scenarioId: string;
  botPopulation: number;
  startingPopulation: number;
  rampPerInterval: number;
  intervalSeconds: number;
  maxDurationMinutes: number;
}

// Test Runs
export type TestRunStatus =
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPED'
  | 'COMPLETED'
  | 'FAILED';

export interface TestRun {
  id: string;
  testId: string;
  status: TestRunStatus;
  startedAt: string;
  pausedAt?: string;
  endedAt?: string;
  seed: number;
}

// Workers
export type WorkerStatus =
  | 'ONLINE'
  | 'BUSY'
  | 'IDLE'
  | 'DRAINING'
  | 'OFFLINE'
  | 'ERROR';

export interface Worker {
  id: string;
  workerId: string;
  status: WorkerStatus;
  hostname?: string;
  version: string;
  maxBots: number;
  currentBotCount: number;
  cpuPercent?: number;
  ramPercent?: number;
  uptimeSeconds?: number;
  lastHeartbeat: string;
}

export interface WorkerRegistration {
  workerId: string;
  version: string;
  maxBots: number;
  token: string;
}

// Bots
export type BotStatus =
  | 'CREATED'
  | 'CONNECTING'
  | 'AUTHENTICATING'
  | 'JOINING'
  | 'SPAWNED'
  | 'ACTIVE'
  | 'SCENARIO'
  | 'PAUSED'
  | 'DISCONNECTING'
  | 'RECONNECTING'
  | 'FAILED'
  | 'STOPPED';

export interface Bot {
  id: string;
  botName: string;
  testRunId: string;
  workerId: string;
  status: BotStatus;
  profileId?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  dimension?: string;
  health?: number;
  food?: number;
  ping?: number;
  connectionTime?: string;
  disconnectReason?: string;
  errorCount: number;
}

// Metrics
export interface Metric {
  id: string;
  testRunId: string;
  timestamp: string;
  tps?: number;
  mspt?: number;
  latencyMs?: number;
  jitterMs?: number;
  connectionTimeMs?: number;
  disconnectRate?: number;
  reconnectRate?: number;
  packetRate?: number;
  packetErrors?: number;
  chunkLatencyMs?: number;
  chunkFailures?: number;
  entityCount?: number;
  botCpuPercent?: number;
  botRamPercent?: number;
  workerCpuPercent?: number;
  workerRamPercent?: number;
  networkThroughputMbps?: number;
  scenarioCompletionPercent?: number;
  scenarioFailures?: number;
}

// Events
export type EventLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type EventType =
  | 'BOT_JOINED'
  | 'BOT_LEFT'
  | 'PERFORMANCE_THRESHOLD'
  | 'WORKER_STATUS'
  | 'TEST_STATUS'
  | 'ALERT';

export interface Event {
  id: string;
  testRunId: string;
  timestamp: string;
  eventType: EventType;
  level: EventLevel;
  message: string;
  botId?: string;
  workerId?: string;
  metadata?: Record<string, any>;
}

// Alerts
export interface AlertRule {
  id: string;
  ruleName: string;
  conditionType: string;
  threshold: number;
  action: 'ALERT' | 'PAUSE_RAMP' | 'PAUSE_TEST' | 'STOP_TEST' | 'WEBHOOK';
}

export interface Alert {
  id: string;
  testRunId: string;
  ruleName: string;
  conditionType: string;
  threshold: number;
  triggeredValue: number;
  action: string;
  acknowledged: boolean;
  triggeredAt: string;
}

// Reports
export interface Report {
  id: string;
  testRunId: string;
  title: string;
  summary: string;
  data: Record<string, any>;
  generatedAt: string;
}

// Dashboard Summary
export interface DashboardSummary {
  activeTests: number;
  activeBots: number;
  connectedWorkers: number;
  totalWorkers: number;
  totalTargets: number;
  testsToday: number;
  failedTests: number;
  averageDurationMinutes: number;
  systemHealth: {
    controllerCpu: number;
    controllerRam: number;
    database: 'healthy' | 'degraded' | 'unhealthy';
    redis: 'healthy' | 'degraded' | 'unhealthy';
    websocket: 'connected' | 'disconnected';
  };
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
