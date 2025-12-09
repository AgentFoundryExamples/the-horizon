// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { createSeededRandom, generateSeedFromId } from '../seeded-random';

describe('Seeded Random Utilities', () => {
  describe('createSeededRandom', () => {
    it('should generate deterministic values for the same seed', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);
      
      const value1a = random1();
      const value1b = random1();
      
      const value2a = random2();
      const value2b = random2();
      
      expect(value1a).toBe(value2a);
      expect(value1b).toBe(value2b);
    });

    it('should generate different values for different seeds', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(54321);
      
      const value1 = random1();
      const value2 = random2();
      
      expect(value1).not.toBe(value2);
    });

    it('should generate values between 0 and 1', () => {
      const random = createSeededRandom(12345);
      
      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should generate a sequence of values', () => {
      const random = createSeededRandom(12345);
      
      const values = [];
      for (let i = 0; i < 10; i++) {
        values.push(random());
      }
      
      // Check that values are different (sequence is progressing)
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(10);
    });

    it('should be independent for different generator instances', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);
      
      // Advance random1
      random1();
      random1();
      
      // random2 should start from beginning
      const value1 = createSeededRandom(12345)();
      const value2 = random2();
      
      expect(value1).toBe(value2);
    });

    it('should handle edge case of zero seed', () => {
      const random = createSeededRandom(0);
      const value = random();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(Number.isFinite(value)).toBe(true);
    });

    it('should handle large seed values', () => {
      const random = createSeededRandom(999999999);
      const value = random();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(Number.isFinite(value)).toBe(true);
    });
  });

  describe('generateSeedFromId', () => {
    it('should generate deterministic seed from string', () => {
      const seed1 = generateSeedFromId('test-id');
      const seed2 = generateSeedFromId('test-id');
      
      expect(seed1).toBe(seed2);
    });

    it('should generate different seeds for different IDs', () => {
      const seed1 = generateSeedFromId('test-id-1');
      const seed2 = generateSeedFromId('test-id-2');
      
      expect(seed1).not.toBe(seed2);
    });

    it('should apply offset correctly', () => {
      const baseSeed = generateSeedFromId('test-id', 0);
      const offsetSeed = generateSeedFromId('test-id', 100);
      
      expect(offsetSeed).toBe(baseSeed + 100);
    });

    it('should handle empty string', () => {
      const seed = generateSeedFromId('', 0);
      
      expect(seed).toBe(0);
      expect(Number.isFinite(seed)).toBe(true);
    });

    it('should handle special characters', () => {
      const seed = generateSeedFromId('test-id-123!@#', 0);
      
      expect(Number.isFinite(seed)).toBe(true);
      expect(seed).toBeGreaterThan(0);
    });

    it('should be case-sensitive', () => {
      const seed1 = generateSeedFromId('TestId');
      const seed2 = generateSeedFromId('testid');
      
      expect(seed1).not.toBe(seed2);
    });

    it('should default offset to 0', () => {
      const seed1 = generateSeedFromId('test-id');
      const seed2 = generateSeedFromId('test-id', 0);
      
      expect(seed1).toBe(seed2);
    });

    it('should handle negative offsets', () => {
      const baseSeed = generateSeedFromId('test-id', 0);
      const negativeSeed = generateSeedFromId('test-id', -50);
      
      expect(negativeSeed).toBe(baseSeed - 50);
    });
  });

  describe('Integration - createSeededRandom with generateSeedFromId', () => {
    it('should produce deterministic random sequences from IDs', () => {
      const seed = generateSeedFromId('galaxy-123', 0);
      const random1 = createSeededRandom(seed);
      const random2 = createSeededRandom(seed);
      
      const values1 = [random1(), random1(), random1()];
      const values2 = [random2(), random2(), random2()];
      
      expect(values1).toEqual(values2);
    });

    it('should create different sequences for different IDs', () => {
      const seed1 = generateSeedFromId('galaxy-1', 0);
      const seed2 = generateSeedFromId('galaxy-2', 0);
      
      const random1 = createSeededRandom(seed1);
      const random2 = createSeededRandom(seed2);
      
      const value1 = random1();
      const value2 = random2();
      
      expect(value1).not.toBe(value2);
    });

    it('should create different sequences with offsets', () => {
      const id = 'solar-system-123';
      
      const seed1 = generateSeedFromId(id, 0);
      const seed2 = generateSeedFromId(id, 1000);
      
      const random1 = createSeededRandom(seed1);
      const random2 = createSeededRandom(seed2);
      
      const value1 = random1();
      const value2 = random2();
      
      expect(value1).not.toBe(value2);
    });

    it('should match the usage pattern in GalaxyView', () => {
      // Simulate the pattern used for star Y-variance
      const galaxyId = 'galaxy-test';
      const starIndex = 0;
      
      const seed = generateSeedFromId(galaxyId, starIndex + 1000);
      const random = createSeededRandom(seed);
      
      const yVariance = (random() - 0.5) * 5;
      
      expect(yVariance).toBeGreaterThanOrEqual(-2.5);
      expect(yVariance).toBeLessThanOrEqual(2.5);
    });
  });

  describe('Performance', () => {
    it('should generate values efficiently', () => {
      const random = createSeededRandom(12345);
      const startTime = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        random();
      }
      
      const endTime = performance.now();
      const timePerCall = (endTime - startTime) / 10000;
      
      // Should be very fast (< 0.001ms per call)
      expect(timePerCall).toBeLessThan(0.001);
    });

    it('should generate seeds efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        generateSeedFromId(`test-id-${i}`, i);
      }
      
      const endTime = performance.now();
      const timePerCall = (endTime - startTime) / 1000;
      
      // Should be very fast (< 0.01ms per call)
      expect(timePerCall).toBeLessThan(0.01);
    });
  });
});
