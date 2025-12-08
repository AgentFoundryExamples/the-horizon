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
/**
 * Tests for galaxy creation edge cases and validation
 * Ensures galaxy creation is robust and handles invalid inputs gracefully
 */

import {
  generateId,
  generateUniqueId,
  ensureGalaxyId,
  createGalaxy,
  isIdUnique,
} from '../mutate';
import type { Universe, Galaxy } from '../types';

describe('Galaxy Creation Edge Cases', () => {
  let testUniverse: Universe;

  beforeEach(() => {
    testUniverse = {
      galaxies: [
        {
          id: 'existing-galaxy',
          name: 'Existing Galaxy',
          description: 'Already exists',
          theme: 'blue-white',
          particleColor: '#4A90E2',
          stars: [],
          solarSystems: [],
        },
      ],
    };
  });

  describe('ensureGalaxyId', () => {
    it('should generate ID from name when ID is missing', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Andromeda Galaxy',
        description: 'Test',
        theme: 'purple',
        particleColor: '#9B59B6',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('andromeda-galaxy');
    });

    it('should preserve provided ID when valid', () => {
      const galaxy: Galaxy = {
        id: 'custom-id',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('custom-id');
    });

    it('should throw error when name is missing', () => {
      const galaxy: Galaxy = {
        id: '',
        name: '',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => ensureGalaxyId(galaxy)).toThrow('Galaxy name is required');
    });

    it('should throw error when name is only whitespace', () => {
      const galaxy: Galaxy = {
        id: '',
        name: '   ',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => ensureGalaxyId(galaxy)).toThrow('Galaxy name is required');
    });

    it('should handle unicode characters in name', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Café Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('cafe-galaxy');
    });

    it('should initialize empty arrays for stars and solarSystems if missing', () => {
      const galaxy = {
        id: '',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
      } as Galaxy;

      const result = ensureGalaxyId(galaxy);
      expect(result.stars).toEqual([]);
      expect(result.solarSystems).toEqual([]);
    });

    it('should preserve existing arrays for stars and solarSystems', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [
          {
            id: 'star-1',
            name: 'Star 1',
            theme: 'yellow',
          },
        ],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy);
      expect(result.stars).toHaveLength(1);
      expect(result.stars[0].id).toBe('star-1');
    });

    it('should handle names that generate empty IDs gracefully', () => {
      const galaxy: Galaxy = {
        id: '',
        name: '!@#$%^&*()',  // Only special characters
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      // Should not throw but use fallback timestamp-based ID
      const result = ensureGalaxyId(galaxy);
      expect(result.id).toMatch(/^galaxy-\d+$/);
    });

    it('should handle missing ID with valid name', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('test-galaxy');
    });

    it('should handle undefined ID with valid name', () => {
      const galaxy: Partial<Galaxy> = {
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy as Galaxy);
      expect(result.id).toBe('test-galaxy');
    });

    it('should avoid ID collisions when universe is provided', () => {
      const testUniverse: Universe = {
        galaxies: [
          {
            id: 'test-galaxy',
            name: 'Existing Galaxy',
            description: 'Test',
            theme: 'blue',
            particleColor: '#000000',
            stars: [],
            solarSystems: [],
          },
        ],
      };

      const galaxy: Galaxy = {
        id: '',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = ensureGalaxyId(galaxy, testUniverse);
      expect(result.id).toBe('test-galaxy-2');
    });
  });

  describe('createGalaxy', () => {
    it('should successfully create a valid galaxy', () => {
      const newGalaxy: Galaxy = {
        id: 'new-galaxy',
        name: 'New Galaxy',
        description: 'A new galaxy',
        theme: 'purple',
        particleColor: '#9B59B6',
        stars: [],
        solarSystems: [],
      };

      const result = createGalaxy(testUniverse, newGalaxy);
      expect(result.galaxies).toHaveLength(2);
      expect(result.galaxies[1].id).toBe('new-galaxy');
    });

    it('should reject galaxy with duplicate ID', () => {
      const duplicateGalaxy: Galaxy = {
        id: 'existing-galaxy',
        name: 'Duplicate',
        description: 'Has duplicate ID',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, duplicateGalaxy)).toThrow(
        "Galaxy ID 'existing-galaxy' already exists"
      );
    });

    it('should reject galaxy with empty name', () => {
      const invalidGalaxy: Galaxy = {
        id: 'test-id',
        name: '',
        description: 'No name',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow('Galaxy name is required');
    });

    it('should reject galaxy with empty description', () => {
      const invalidGalaxy: Galaxy = {
        id: 'test-id',
        name: 'Test',
        description: '',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow('Invalid galaxy');
    });

    it('should reject galaxy with empty theme', () => {
      const invalidGalaxy: Galaxy = {
        id: 'test-id',
        name: 'Test',
        description: 'Test',
        theme: '',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow('Invalid galaxy');
    });

    it('should reject galaxy with empty particleColor', () => {
      const invalidGalaxy: Galaxy = {
        id: 'test-id',
        name: 'Test',
        description: 'Test',
        theme: 'blue',
        particleColor: '',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow('Invalid galaxy');
    });

    it('should auto-generate ID when missing', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Auto ID Galaxy',
        description: 'Will get auto ID',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = createGalaxy(testUniverse, galaxy);
      expect(result.galaxies).toHaveLength(2);
      expect(result.galaxies[1].id).toBe('auto-id-galaxy');
    });

    it('should not modify original universe object', () => {
      const newGalaxy: Galaxy = {
        id: 'new-galaxy',
        name: 'New Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const originalLength = testUniverse.galaxies.length;
      createGalaxy(testUniverse, newGalaxy);
      
      expect(testUniverse.galaxies).toHaveLength(originalLength);
    });

    it('should handle galaxy with minimal valid data', () => {
      const minimalGalaxy: Galaxy = {
        id: 'minimal',
        name: 'M',
        description: 'D',
        theme: 'T',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = createGalaxy(testUniverse, minimalGalaxy);
      expect(result.galaxies).toHaveLength(2);
    });
  });

  describe('ID Uniqueness', () => {
    it('should correctly detect duplicate galaxy IDs', () => {
      expect(isIdUnique(testUniverse, 'existing-galaxy', 'galaxy')).toBe(false);
      expect(isIdUnique(testUniverse, 'non-existing', 'galaxy')).toBe(true);
    });

    it('should handle case sensitivity correctly', () => {
      // IDs should be case-sensitive
      expect(isIdUnique(testUniverse, 'Existing-Galaxy', 'galaxy')).toBe(true);
      expect(isIdUnique(testUniverse, 'existing-galaxy', 'galaxy')).toBe(false);
    });

    it('should allow same name but different IDs', () => {
      const galaxy1: Galaxy = {
        id: 'galaxy-1',
        name: 'Same Name',
        description: 'First',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const galaxy2: Galaxy = {
        id: 'galaxy-2',
        name: 'Same Name',
        description: 'Second',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result1 = createGalaxy(testUniverse, galaxy1);
      const result2 = createGalaxy(result1, galaxy2);
      
      expect(result2.galaxies).toHaveLength(3);
    });
  });

  describe('generateId', () => {
    it('should handle empty string', () => {
      expect(generateId('')).toBe('');
    });

    it('should handle only special characters', () => {
      expect(generateId('!@#$%^&*()')).toBe('');
    });

    it('should handle mixed alphanumeric and special characters', () => {
      expect(generateId('Galaxy-42!')).toBe('galaxy-42');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateId('-Galaxy-')).toBe('galaxy');
    });

    it('should collapse multiple spaces to single hyphen', () => {
      expect(generateId('Big   Bang   Galaxy')).toBe('big-bang-galaxy');
    });

    it('should collapse multiple hyphens to single hyphen', () => {
      expect(generateId('Galaxy---Test')).toBe('galaxy-test');
    });

    it('should handle numbers correctly', () => {
      expect(generateId('NGC 1234')).toBe('ngc-1234');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique ID when base ID is available', () => {
      const result = generateUniqueId('Test Galaxy', testUniverse, 'galaxy');
      expect(result).toBe('test-galaxy');
    });

    it('should append suffix when base ID exists', () => {
      const universeWithDuplicate: Universe = {
        galaxies: [
          {
            id: 'test-galaxy',
            name: 'Test',
            description: 'Test',
            theme: 'blue',
            particleColor: '#000000',
            stars: [],
            solarSystems: [],
          },
        ],
      };

      const result = generateUniqueId('Test Galaxy', universeWithDuplicate, 'galaxy');
      expect(result).toBe('test-galaxy-2');
    });

    it('should handle multiple collisions', () => {
      const universeWithMultiple: Universe = {
        galaxies: [
          {
            id: 'test-galaxy',
            name: 'Test 1',
            description: 'Test',
            theme: 'blue',
            particleColor: '#000000',
            stars: [],
            solarSystems: [],
          },
          {
            id: 'test-galaxy-2',
            name: 'Test 2',
            description: 'Test',
            theme: 'blue',
            particleColor: '#000000',
            stars: [],
            solarSystems: [],
          },
        ],
      };

      const result = generateUniqueId('Test Galaxy', universeWithMultiple, 'galaxy');
      expect(result).toBe('test-galaxy-3');
    });

    it('should use timestamp-based fallback for invalid names', () => {
      const result = generateUniqueId('!@#$', testUniverse, 'galaxy');
      expect(result).toMatch(/^galaxy-\d+$/);
    });
  });
});
