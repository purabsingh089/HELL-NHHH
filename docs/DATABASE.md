# MineStress Database Schema

## Overview

MineStress uses PostgreSQL for persistent storage with the following key entities:

## Core Entities

### Users & Authentication
- `users` - User accounts with email/password
- `roles` - RBAC roles (owner, admin, operator, developer, viewer)
- `user_roles` - User to role mappings
- `permissions` - Fine-grained permissions
- `role_permissions` - Role to permission mappings
- `api_keys` - API authentication tokens

### Infrastructure
- `servers` - Minecraft server targets
- `workers` - Load-testing worker agents
- `worker_sessions` - Worker test assignments

### Tests & Scenarios
- `tests` - Test configurations
- `test_runs` - Execution instances of tests
- `scenarios` - Test scenarios and workflows
- `bot_profiles` - Behavioral profiles for bots

### Runtime Data
- `bots` - Individual bot instances
- `metrics` - Time-series performance metrics (aggregated)
- `events` - Low-frequency test events
- `alerts` - Triggered alert rules

### Analysis
- `reports` - Generated test reports
- `benchmarks` - Saved benchmark runs
- `audit_logs` - Administrative action log

### Configuration
- `settings` - System configuration key-value pairs
- `proxy_pools` - Proxy pool definitions
- `proxies` - Individual proxy entries

## Key Design Decisions

### Metrics Strategy
- Raw metrics are NOT stored at high frequency in relational tables
- Metrics are AGGREGATED on worker before sending to controller
- Controller stores only aggregated metrics with 1-second granularity
- For longer retention, implement time-series database (InfluxDB/TimescaleDB)

### Indexing
- Heavy indexes on frequently queried fields (test_run_id, status, timestamp)
- Foreign key relationships properly indexed
- Avoid N+1 queries through proper JOIN design

### Retention
- Raw metrics: 7 days in PostgreSQL
- Aggregated metrics: 30 days in PostgreSQL
- Long-term storage: archive to S3/external TSDB
- Detailed events: 30 days
- Audit logs: 90 days (compliance)

## Running Migrations

```bash
# Apply migrations
psql -U minestress -d minestress -f infrastructure/migrations/001_initial_schema.sql

# Or via migration tool
npm run db:migrate
```
