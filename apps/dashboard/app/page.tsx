'use client';

import { useEffect, useMemo, useState } from 'react';

const controllerUrl = process.env.NEXT_PUBLIC_CONTROLLER_URL || 'http://localhost:4000';

type TestRecord = {
  id: string;
  name: string;
  status: string;
  population: number;
  scenario: string;
  durationMinutes: number;
  workers: string[];
  createdAt: string;
  metrics: Array<{ timestamp: string; tps: number; mspt: number; latency: number; connected: number }>; 
};

export default function DashboardPage() {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; status: string; botCount: number; capacity: number }>>([]);
  const [summary, setSummary] = useState({
    activeTests: 0,
    activeBots: 0,
    connectedWorkers: 0,
    totalWorkers: 0,
    totalTargets: 0,
    testsToday: 0,
    failedTests: 0,
    averageDurationMinutes: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [testsRes, workersRes, summaryRes] = await Promise.all([
          fetch(`${controllerUrl}/api/tests`),
          fetch(`${controllerUrl}/api/workers`),
          fetch(`${controllerUrl}/api/summary`),
        ]);

        const testsData = await testsRes.json();
        const workersData = await workersRes.json();
        const summaryData = await summaryRes.json();

        setTests(testsData.tests || []);
        setWorkers(workersData.workers || []);
        setSummary(summaryData.summary || summary);
      } catch (error) {
        console.error('Dashboard fetch error', error);
      }
    };

    load();

    const socket = new WebSocket('ws://localhost:4000');
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'summary') {
          setSummary(payload.payload);
        }
        if (payload.type === 'tests') {
          setTests(payload.payload);
        }
        if (payload.type === 'workers') {
          setWorkers(payload.payload);
        }
      } catch (e) {
        console.error('WebSocket parse error', e);
      }
    };

    return () => socket.close();
  }, []);

  const latestMetrics = useMemo(() => {
    const latest = tests.flatMap((test) => test.metrics);
    return latest[latest.length - 1];
  }, [tests]);

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">MINESTRESS</div>
        <nav>
          <a>Overview</a>
          <a>Tests</a>
          <a>Scenarios</a>
          <a>Bots</a>
          <a>Workers</a>
          <a>Analytics</a>
          <a>Benchmarks</a>
        </nav>
        <button className="danger-button">Emergency Stop</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <h1>Overview</h1>
          <div className="status-row">
            <span className="chip success">Controller online</span>
            <span className="chip">Live telemetry</span>
          </div>
        </header>

        <div className="kpi-grid">
          <div className="card"><label>Active Tests</label><strong>{summary.activeTests}</strong></div>
          <div className="card"><label>Active Bots</label><strong>{summary.activeBots}</strong></div>
          <div className="card"><label>Connected Workers</label><strong>{summary.connectedWorkers}</strong></div>
          <div className="card"><label>Total Workers</label><strong>{summary.totalWorkers}</strong></div>
          <div className="card"><label>Server Targets</label><strong>{summary.totalTargets}</strong></div>
          <div className="card"><label>Tests Today</label><strong>{summary.testsToday}</strong></div>
          <div className="card"><label>Failed Tests</label><strong>{summary.failedTests}</strong></div>
          <div className="card"><label>Avg Duration</label><strong>{summary.averageDurationMinutes}m</strong></div>
        </div>

        <div className="panel-grid">
          <div className="panel">
            <h3>Live system health</h3>
            <div className="metric-list">
              <div><span>Controller CPU</span><strong>42%</strong></div>
              <div><span>Controller RAM</span><strong>61%</strong></div>
              <div><span>Worker CPU</span><strong>48%</strong></div>
              <div><span>Database</span><strong>Healthy</strong></div>
              <div><span>Redis</span><strong>Healthy</strong></div>
              <div><span>WebSocket</span><strong>Connected</strong></div>
            </div>
          </div>

          <div className="panel">
            <h3>Current telemetry</h3>
            <div className="metric-list">
              <div><span>TPS</span><strong>{latestMetrics?.tps?.toFixed(1) ?? '0.0'}</strong></div>
              <div><span>MSPT</span><strong>{latestMetrics?.mspt?.toFixed(1) ?? '0.0'} ms</strong></div>
              <div><span>Latency</span><strong>{latestMetrics?.latency?.toFixed(1) ?? '0.0'} ms</strong></div>
              <div><span>Connected</span><strong>{latestMetrics?.connected ?? 0}</strong></div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Recent tests</h3>
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Target</th>
                <th>Bots</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>{test.name}</td>
                  <td>{test.targetId}</td>
                  <td>{test.population}</td>
                  <td>{test.durationMinutes}m</td>
                  <td>{test.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>Workers</h3>
          <div className="worker-list">
            {workers.map((worker) => (
              <div className="worker-row" key={worker.id}>
                <span>{worker.id}</span>
                <span>{worker.status}</span>
                <span>{worker.botCount}/{worker.capacity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
