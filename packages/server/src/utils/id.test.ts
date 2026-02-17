import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns a 26-character ULID', () => {
    const id = generateId();
    expect(id).toHaveLength(26);
  });

  it('returns IDs that are lexicographically sortable by time', async () => {
    const id1 = generateId();
    // Small delay to ensure time-based ordering
    await new Promise((resolve) => setTimeout(resolve, 2));
    const id2 = generateId();
    expect(id1 < id2).toBe(true);
  });

  it('generates 100 unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});
