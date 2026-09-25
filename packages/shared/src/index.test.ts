import { describe, expect, it } from 'vitest';
import { type TestDefinition } from './index';

describe('shared types', () => {
  it('creates a valid test shape', () => {
    const testDef: TestDefinition = {
      id: 'TEST-2026-000001',
      name: 'Realistic Survival',
      targetId: 'target-1',
      status: 'READY',
      population: 500,
      rampPerInterval: 25,
      intervalSeconds: 10,
      durationMinutes: 30,
      scenario: 'Realistic Survival',
      workers: [],
      createdAt: new Date().toISOString(),
      metrics: [],
      events: [],
    };

    expect(testDef.population).toBeGreaterThan(0);
    expect(testDef.status).toBe('READY');
  });
});
