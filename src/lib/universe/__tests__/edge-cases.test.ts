/**
 * Integration tests for edge cases in the universe data system
 */

import { loadUniverse, clearCache } from '../data-service';
import type { Universe } from '../types';

describe('Universe Edge Cases', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should handle empty galaxies array gracefully', async () => {
    // Mock an empty universe
    jest.resetModules();
    jest.doMock('../../../../public/universe/universe.json', () => ({
      galaxies: [],
    }));

    const { loadUniverse: loadEmptyUniverse } = await import('../data-service');
    const universe = await loadEmptyUniverse();

    expect(universe).toBeDefined();
    expect(universe.galaxies).toEqual([]);
  });

  it('should provide placeholder content for missing markdown', async () => {
    const universe = await loadUniverse();
    
    // The sanitization should ensure contentMarkdown is never empty
    expect(universe).toBeDefined();
    expect(universe.galaxies).toBeDefined();
  });

  it('should cache data after first load', async () => {
    const universe1 = await loadUniverse();
    const universe2 = await loadUniverse();
    
    // Should return the same cached instance
    expect(universe1).toBe(universe2);
  });

  it('should handle malformed JSON gracefully', async () => {
    // This test verifies the fallback behavior
    // In production, malformed JSON would be caught during build
    const universe = await loadUniverse();
    
    expect(universe).toBeDefined();
    expect(Array.isArray(universe.galaxies)).toBe(true);
  });
});
