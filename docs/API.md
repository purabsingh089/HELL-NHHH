# MineStress API Documentation

## Base URL

```
http://localhost:4000/api
```

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### POST /auth/login
Login with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "expiresIn": 86400
  }
}
```

### Tests

#### GET /tests
List all tests.

**Query Parameters:**
- `status` - Filter by status (DRAFT, ACTIVE, etc.)
- `serverId` - Filter by server
- `limit` - Page size (default 50)
- `offset` - Pagination offset

#### POST /tests
Create a new test.

**Request:**
```json
{
  "name": "Realistic Survival Test",
  "serverId": "uuid",
  "scenarioId": "uuid",
  "botPopulation": 500,
  "startingPopulation": 25,
  "rampPerInterval": 25,
  "intervalSeconds": 10,
  "maxDurationMinutes": 30
}
```

#### GET /tests/:id
Get test details.

#### POST /tests/:id/start
Start a test.

#### POST /tests/:id/pause
Pause a running test.

#### POST /tests/:id/resume
Resume a paused test.

#### POST /tests/:id/stop
Stop a running test.

#### POST /tests/:id/replay
Replay a completed test.

### Servers

#### GET /servers
List all server targets.

#### POST /servers
Create a new server target.

#### DELETE /servers/:id
Delete a server target.

### Scenarios

#### GET /scenarios
List all scenarios.

#### POST /scenarios
Create a new scenario.

#### GET /scenarios/:id
Get scenario details.

### Workers

#### GET /workers
List all workers.

#### GET /workers/:id
Get worker details.

#### POST /workers/:id/drain
Gracefully drain a worker.

#### POST /workers/:id/restart
Restart a worker.

### Bots

#### GET /bots
List all bots (paginated).

**Query Parameters:**
- `testRunId` - Filter by test run
- `status` - Filter by status
- `workerId` - Filter by worker

#### GET /bots/:id
Get bot details.

#### POST /bots/:id/command
Send command to a bot.

**Request:**
```json
{
  "command": "move",
  "args": {"x": 100, "y": 64, "z": 100}
}
```

### Metrics

#### GET /metrics/:testRunId
Get metrics for a test run.

**Query Parameters:**
- `start` - Start timestamp
- `end` - End timestamp
- `interval` - Aggregation interval (default 1s)

#### GET /metrics/:testRunId/summary
Get summary statistics for a test run.

### Reports

#### GET /reports/:testRunId
Get or generate report for a test run.

#### POST /reports/:testRunId/export
Export report in format.

**Query Parameters:**
- `format` - json, csv, or pdf

### System

#### GET /summary
Get dashboard summary.

#### GET /health
Get system health status.

## WebSocket Channels

Connect to `ws://localhost:4000` and subscribe to channels:

### test:{testRunId}:metrics
Live metrics for a test run.

```json
{
  "type": "metric",
  "testRunId": "uuid",
  "timestamp": "2026-09-25T18:00:00Z",
  "tps": 19.5,
  "mspt": 31,
  "latency": 45
}
```

### test:{testRunId}:events
Events from a test run.

```json
{
  "type": "event",
  "testRunId": "uuid",
  "eventType": "BOT_JOINED",
  "message": "Bot #812 joined",
  "timestamp": "2026-09-25T18:00:00Z"
}
```

### worker:{workerId}:status
Worker health and status updates.

### system:alerts
System-wide alerts and errors.
