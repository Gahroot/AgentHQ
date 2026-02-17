/**
 * Agent health calculation tests
 */

import { calculateAgentHealth } from './agent-health';
import { Agent } from '@/types';

function createMockAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: 'test-agent',
    org_id: 'test-org',
    name: 'Test Agent',
    description: null,
    api_key_prefix: 'ahq_test',
    owner_user_id: null,
    status: 'online',
    last_heartbeat: new Date().toISOString(),
    capabilities: [],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('calculateAgentHealth', () => {
  it('should return offline when no heartbeat within 5 minutes', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    });
    const result = calculateAgentHealth(agent, 10, 5);
    expect(result.status).toBe('offline');
    expect(result.score).toBe(0);
  });

  it('should return thriving with high score', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date().toISOString(),
    });
    const result = calculateAgentHealth(agent, 15, 6);
    expect(result.status).toBe('thriving');
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('should return healthy with moderate score', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    });
    const result = calculateAgentHealth(agent, 7, 3);
    expect(result.status).toBe('healthy');
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(80);
  });

  it('should return struggling with low score', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    });
    const result = calculateAgentHealth(agent, 2, 1);
    expect(result.status).toBe('struggling');
    expect(result.score).toBeLessThan(50);
  });

  it('should respect manual override in metadata', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      metadata: { healthStatus: 'thriving' },
    });
    const result = calculateAgentHealth(agent, 0, 0);
    expect(result.status).toBe('thriving');
    expect(result.score).toBe(90);
  });

  it('should return stale when no activity in 24 hours', () => {
    const agent = createMockAgent({
      last_heartbeat: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    const result = calculateAgentHealth(agent, 0, 0);
    expect(result.status).toBe('stale');
    expect(result.score).toBe(20);
  });
});
