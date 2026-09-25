import cors from 'cors';
import express from 'express';
import http from 'http';
import { randomUUID } from 'crypto';
import { WebSocketServer, type RawData } from 'ws';

import type {
  DashboardSummary,
  Event,
  Metric,
  Test,
  TestStatus,
  Worker,
  WorkerStatus,
} from '@minestress/api-types';

const PORT = Number(process.env.CONTROLLER_PORT || 4000);

type TestRecord = Test & {
  metrics: Metric[];
  events: Event[];
  currentBots: number;
  startedAt?: string;
  pausedAt?: string;
  endedAt?: string;
  testRunId: string;
  scenario: string;
  targetId: string;
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const tests = new Map<string, TestRecord>();
const workers = new Map<string, Worker>();
let nextTestNumber = 1;

app.use(cors());
app.use(express.json());

function sendToClients(type: string, payload: unknown) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function buildSummary(): DashboardSummary {
  const activeTestCount = Array.from(tests.values()).filter((test) => test.status === 'ACTIVE').length;
  const activeBots = Array.from(tests.values()).reduce((sum, test) => sum + (test.status === 'ACTIVE' ? test.currentBots : 0), 0);
  const connectedWorkers = Array.from(workers.values()).filter((worker) => worker.status !== 'OFFLINE').length;
  const totalWorkers = workers.size;
  const totalTargets = 1;
  const testsToday = tests.size;
  const failedTests = Array.from(tests.values()).filter((test) => test.status === 'FAILED').length;
  const averageDurationMinutes = tests.size
    ? Math.round(Array.from(tests.values()).reduce((sum, test) => sum + test.maxDurationMinutes, 0) / tests.size)
    : 0;

  return {
    activeTests: activeTestCount,
    activeBots,
    connectedWorkers,
    totalWorkers,
    totalTargets,
    testsToday,
    failedTests,
    averageDurationMinutes,
    systemHealth: {
      controllerCpu: 42,
      controllerRam: 61,
      database: 'healthy',
      redis: 'healthy',
      websocket: 'connected',
    },
  };
}

function addEvent(test: TestRecord, eventType: Event['eventType'], level: Event['level'], message: string, metadata?: Record<string, any>) {
  const event: Event = {
    id: randomUUID(),
    testRunId: test.testRunId,
    timestamp: new Date().toISOString(),
    eventType,
    level,
    message,
    metadata,
  };

  test.events.push(event);
  if (test.events.length > 100) {
    test.events.shift();
  }

  sendToClients('events', event);
}

function createMetric(test: TestRecord): Metric {
  const base = Math.max(1, test.currentBots / 40);
  const tps = Math.max(0, 19.8 - base * 0.14 + Math.random() * 1.8);
  const mspt = Math.max(8, 28 + (test.currentBots / 10) * 0.4 + Math.random() * 12);
  const latencyMs = Math.max(20, 35 + test.currentBots * 0.08 + Math.random() * 30);

  return {
    id: randomUUID(),
    testRunId: test.testRunId,
    timestamp: new Date().toISOString(),
    tps,
    mspt,
    latencyMs,
    jitterMs: Math.random() * 8,
    connectionTimeMs: 150 + Math.random() * 120,
    disconnectRate: Math.random() * 0.03,
    reconnectRate: Math.random() * 0.04,
    packetRate: Math.round(600 + test.currentBots * 2.4),
    packetErrors: Math.floor(Math.random() * 5),
    chunkLatencyMs: 30 + Math.random() * 40,
    chunkFailures: Math.random() > 0.98 ? 1 : 0,
    entityCount: test.currentBots,
    botCpuPercent: 10 + Math.random() * 35,
    botRamPercent: 8 + Math.random() * 30,
    workerCpuPercent: 25 + Math.random() * 50,
    workerRamPercent: 20 + Math.random() * 40,
    networkThroughputMbps: Math.random() * 120,
    scenarioCompletionPercent: Math.min(100, 90 + Math.random() * 10),
    scenarioFailures: Math.random() > 0.98 ? 1 : 0,
  };
}

function tickTestRuntime() {
  for (const test of tests.values()) {
    if (test.status !== 'ACTIVE') {
      continue;
    }

    const now = Date.now();
    const startedAt = test.startedAt ? new Date(test.startedAt).getTime() : now;
    const elapsed = (now - startedAt) / 1000;
    const shouldRamp = elapsed > 0 && Math.floor(elapsed / Math.max(test.intervalSeconds, 1)) >= 1;

    if (shouldRamp && test.currentBots < test.botPopulation) {
      test.currentBots = Math.min(test.botPopulation, test.currentBots + test.rampPerInterval);
      addEvent(test, 'TEST_STATUS', 'INFO', `Load ramp increased to ${test.currentBots} bots`, { currentBots: test.currentBots });
    }

    if (test.currentBots >= test.botPopulation && test.status === 'ACTIVE') {
      addEvent(test, 'TEST_STATUS', 'INFO', 'Target population reached', { currentBots: test.currentBots });
    }

    const metric = createMetric(test);
    test.metrics.push(metric);
    if (test.metrics.length > 120) {
      test.metrics.shift();
    }

    if (metric.mspt && metric.mspt > 50) {
      addEvent(test, 'PERFORMANCE_THRESHOLD', 'WARN', `MSPT exceeded threshold: ${metric.mspt.toFixed(1)}ms`, { mspt: metric.mspt });
    }

    if (metric.tps && metric.tps < 18) {
      addEvent(test, 'PERFORMANCE_THRESHOLD', 'WARN', `TPS below threshold: ${metric.tps.toFixed(1)}`, { tps: metric.tps });
    }

    sendToClients('metrics', {
      testRunId: test.testRunId,
      metric,
    });
  }

  sendToClients('summary', buildSummary());
  sendToClients('tests', Array.from(tests.values()).map((test) => ({ ...test, metrics: test.metrics.slice(-10) })));
}

setInterval(tickTestRuntime, 1000);

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/api/summary', (_req, res) => {
  res.json({
    success: true,
    data: { summary: buildSummary() },
  });
});

app.get('/api/tests', (_req, res) => {
  res.json({
    success: true,
    data: {
      tests: Array.from(tests.values()).map((test) => ({
        ...test,
        metrics: test.metrics.slice(-10),
      })),
    },
  });
});

app.post('/api/tests', (req, res) => {
  const body = req.body ?? {};
  const name = body.name || 'New Test';
  const serverId = body.serverId || 'server-default';
  const scenarioId = body.scenarioId || 'scenario-default';
  const test: TestRecord = {
    id: randomUUID(),
    testNumber: nextTestNumber++,
    name,
    serverId,
    status: 'READY',
    scenarioId,
    botPopulation: Number(body.botPopulation || 100),
    startingPopulation: Number(body.startingPopulation || 25),
    rampPerInterval: Number(body.rampPerInterval || 10),
    intervalSeconds: Number(body.intervalSeconds || 10),
    maxDurationMinutes: Number(body.maxDurationMinutes || 30),
    reconnectBehavior: body.reconnectBehavior || 'disabled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: [],
    events: [],
    currentBots: Number(body.startingPopulation || 25),
    testRunId: randomUUID(),
    scenario: body.scenario || 'Realistic Survival',
    targetId: serverId,
  };

  tests.set(test.id, test);
  addEvent(test, 'TEST_STATUS', 'INFO', `Test ${test.name} created`, { testId: test.id });
  sendToClients('tests', Array.from(tests.values()).map((entry) => ({ ...entry, metrics: entry.metrics.slice(-10) })));
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: test });
});

app.get('/api/tests/:id', (req, res) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ success: false, error: 'Test not found' });
    return;
  }

  res.json({ success: true, data: test });
});

app.post('/api/tests/:id/start', (req, res) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ success: false, error: 'Test not found' });
    return;
  }

  test.status = 'ACTIVE';
  test.startedAt = new Date().toISOString();
  test.currentBots = test.startingPopulation;
  test.testRunId = randomUUID();
  addEvent(test, 'TEST_STATUS', 'INFO', 'Test started', { currentBots: test.currentBots });
  sendToClients('tests', Array.from(tests.values()).map((entry) => ({ ...entry, metrics: entry.metrics.slice(-10) })));
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: test });
});

app.post('/api/tests/:id/pause', (req, res) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ success: false, error: 'Test not found' });
    return;
  }

  test.status = 'PAUSED';
  test.pausedAt = new Date().toISOString();
  addEvent(test, 'TEST_STATUS', 'WARN', 'Test paused', { currentBots: test.currentBots });
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: test });
});

app.post('/api/tests/:id/resume', (req, res) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ success: false, error: 'Test not found' });
    return;
  }

  test.status = 'ACTIVE';
  test.startedAt = new Date().toISOString();
  addEvent(test, 'TEST_STATUS', 'INFO', 'Test resumed', { currentBots: test.currentBots });
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: test });
});

app.post('/api/tests/:id/stop', (req, res) => {
  const test = tests.get(req.params.id);
  if (!test) {
    res.status(404).json({ success: false, error: 'Test not found' });
    return;
  }

  test.status = 'STOPPED';
  test.endedAt = new Date().toISOString();
  addEvent(test, 'TEST_STATUS', 'INFO', 'Test stopped', { currentBots: test.currentBots });
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: test });
});

app.get('/api/workers', (_req, res) => {
  res.json({
    success: true,
    data: {
      workers: Array.from(workers.values()),
    },
  });
});

app.post('/api/workers/register', (req, res) => {
  const body = req.body ?? {};
  const workerId = body.workerId || `worker-${randomUUID().slice(0, 8)}`;
  const worker: Worker = {
    id: randomUUID(),
    workerId,
    status: 'ONLINE',
    hostname: 'simulated-worker',
    version: body.version || '0.1.0',
    maxBots: Number(body.maxBots || 250),
    currentBotCount: 0,
    cpuPercent: 15,
    ramPercent: 30,
    uptimeSeconds: 0,
    lastHeartbeat: new Date().toISOString(),
  };

  workers.set(workerId, worker);
  sendToClients('workers', Array.from(workers.values()));
  sendToClients('summary', buildSummary());

  res.json({ success: true, data: worker });
});

app.post('/api/workers/:id/heartbeat', (req, res) => {
  const worker = workers.get(req.params.id);
  if (!worker) {
    res.status(404).json({ success: false, error: 'Worker not found' });
    return;
  }

  worker.status = 'ONLINE';
  worker.lastHeartbeat = new Date().toISOString();
  worker.cpuPercent = 10 + Math.random() * 50;
  worker.ramPercent = 15 + Math.random() * 40;
  worker.currentBotCount = Math.max(0, Math.round(worker.currentBotCount + (Math.random() > 0.5 ? 1 : -1)));

  sendToClients('workers', Array.from(workers.values()));
  res.json({ success: true, data: worker });
});

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'summary', payload: buildSummary() }));
  socket.send(JSON.stringify({ type: 'tests', payload: Array.from(tests.values()).map((test) => ({ ...test, metrics: test.metrics.slice(-10) })) }));
  socket.send(JSON.stringify({ type: 'workers', payload: Array.from(workers.values()) }));
});

wss.on('message', (_message: RawData) => {
  // no-op; framework is ready for future subscriptions
});

server.listen(PORT, () => {
  console.log(`MineStress controller listening on http://localhost:${PORT}`);
});
