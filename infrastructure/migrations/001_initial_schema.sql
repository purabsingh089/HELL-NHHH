-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
  ('owner', 'Full system access'),
  ('admin', 'System and user management'),
  ('operator', 'Test execution and monitoring'),
  ('developer', 'API access and plugins'),
  ('viewer', 'Read-only access');

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Server Targets
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 25565,
  minecraft_version VARCHAR(50) NOT NULL,
  server_type VARCHAR(50),
  connection_method VARCHAR(50) DEFAULT 'direct',
  authorized BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(host, port)
);

-- Scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  definition JSONB NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scenarios_name ON scenarios(name);

-- Behavior Profiles
CREATE TABLE bot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  behavior JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bot_profiles (name, description, behavior) VALUES
  ('Casual Player', 'Standard casual player behavior', '{"movement": 0.6, "chat": 0.2, "exploration": 0.1, "inventory": 0.1}'::jsonb),
  ('Explorer', 'Primarily explores', '{"movement": 0.8, "exploration": 0.2}'::jsonb),
  ('Miner', 'Focuses on mining', '{"mining": 0.7, "movement": 0.3}'::jsonb),
  ('AFK', 'Idle behavior', '{"idle": 1.0}'::jsonb);

-- Tests
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number BIGSERIAL UNIQUE,
  name VARCHAR(255) NOT NULL,
  server_id UUID REFERENCES servers(id),
  status VARCHAR(50) DEFAULT 'DRAFT',
  scenario_id UUID REFERENCES scenarios(id),
  bot_population INTEGER DEFAULT 100,
  starting_population INTEGER DEFAULT 10,
  ramp_per_interval INTEGER DEFAULT 10,
  interval_seconds INTEGER DEFAULT 60,
  max_duration_minutes INTEGER DEFAULT 30,
  reconnect_behavior VARCHAR(50) DEFAULT 'disabled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_status ON tests(status);
CREATE INDEX idx_tests_server ON tests(server_id);

-- Test Runs (Execution instances)
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'RUNNING',
  started_at TIMESTAMP,
  paused_at TIMESTAMP,
  ended_at TIMESTAMP,
  seed BIGINT,
  error_message TEXT
);

CREATE INDEX idx_test_runs_test ON test_runs(test_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);

-- Workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'OFFLINE',
  hostname VARCHAR(255),
  version VARCHAR(50),
  max_bots INTEGER DEFAULT 250,
  current_bot_count INTEGER DEFAULT 0,
  cpu_percent FLOAT,
  ram_percent FLOAT,
  uptime_seconds BIGINT,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workers_status ON workers(status);

-- Worker Sessions (assignments)
CREATE TABLE worker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  bot_count INTEGER DEFAULT 0,
  status VARCHAR(50),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Bots
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name VARCHAR(255) NOT NULL,
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  status VARCHAR(50) DEFAULT 'CREATED',
  profile_id UUID REFERENCES bot_profiles(id),
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  dimension VARCHAR(100),
  health FLOAT,
  food INTEGER,
  ping INTEGER,
  connection_time TIMESTAMP,
  disconnect_reason TEXT,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bots_test_run ON bots(test_run_id);
CREATE INDEX idx_bots_worker ON bots(worker_id);
CREATE INDEX idx_bots_status ON bots(status);

-- Metrics (aggregated time-series)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  tps FLOAT,
  mspt FLOAT,
  latency_ms FLOAT,
  jitter_ms FLOAT,
  connection_time_ms FLOAT,
  disconnect_rate FLOAT,
  reconnect_rate FLOAT,
  packet_rate INTEGER,
  packet_errors INTEGER,
  chunk_latency_ms FLOAT,
  chunk_failures INTEGER,
  entity_count INTEGER,
  bot_cpu_percent FLOAT,
  bot_ram_percent FLOAT,
  worker_cpu_percent FLOAT,
  worker_ram_percent FLOAT,
  network_throughput_mbps FLOAT,
  scenario_completion_percent FLOAT,
  scenario_failures INTEGER
);

CREATE INDEX idx_metrics_test_run ON metrics(test_run_id, timestamp DESC);

-- Events (low-frequency events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(50),
  level VARCHAR(20) DEFAULT 'INFO',
  message TEXT,
  bot_id UUID REFERENCES bots(id),
  worker_id UUID REFERENCES workers(id),
  metadata JSONB
);

CREATE INDEX idx_events_test_run ON events(test_run_id, timestamp DESC);
CREATE INDEX idx_events_type ON events(event_type);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  rule_name VARCHAR(255),
  condition_type VARCHAR(50),
  threshold FLOAT,
  triggered_value FLOAT,
  action VARCHAR(50),
  acknowledged BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP,
  acknowledged_at TIMESTAMP
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT,
  data JSONB,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benchmarks
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  server_id UUID REFERENCES servers(id),
  minecraft_version VARCHAR(50),
  server_software VARCHAR(50),
  scenario_id UUID REFERENCES scenarios(id),
  population INTEGER,
  duration_minutes INTEGER,
  seed BIGINT,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  result VARCHAR(20),
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Settings
CREATE TABLE settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value) VALUES
  ('max_bots_per_test', '{"limit": 10000}'::jsonb),
  ('max_test_duration', '{"limit_minutes": 480}'::jsonb),
  ('max_ramp_speed', '{"bots_per_second": 100}'::jsonb),
  ('telemetry_retention_days', '{"days": 30}'::jsonb);

-- Proxy Pools
CREATE TABLE proxy_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES proxy_pools(id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  protocol VARCHAR(10),
  status VARCHAR(50) DEFAULT 'UNKNOWN',
  latency_ms INTEGER,
  failure_count INTEGER DEFAULT 0,
  assigned_bot_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proxies_pool ON proxies(pool_id);
CREATE INDEX idx_proxies_status ON proxies(status);
