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

import {
  generateId,
  ensureGalaxyId,
  isIdUnique,
  getAllIds,
  createGalaxy,
  updateGalaxy,
  deleteGalaxy,
  createSolarSystem,
  updateSolarSystem,
  deleteSolarSystem,
  createPlanet,
  updatePlanet,
  deletePlanet,
  createMoon,
  updateMoon,
  deleteMoon,
  createStar,
  updateStar,
  deleteStar,
  serializeUniverse,
  parseAndValidateUniverse,
} from '../mutate';
import type { Universe, Galaxy, SolarSystem, Planet, Moon, Star } from '../types';

describe('Universe Mutations', () => {
  let testUniverse: Universe;

  beforeEach(() => {
    testUniverse = {
      galaxies: [
        {
          id: 'test-galaxy',
          name: 'Test Galaxy',
          description: 'A test galaxy',
          theme: 'blue-white',
          particleColor: '#4A90E2',
          stars: [
            {
              id: 'test-star',
              name: 'Test Star',
              theme: 'yellow',
            },
          ],
          solarSystems: [
            {
              id: 'test-system',
              name: 'Test System',
              theme: 'yellow',
              mainStar: {
                id: 'main-star',
                name: 'Main Star',
                theme: 'yellow-dwarf',
              },
              planets: [
                {
                  id: 'test-planet',
                  name: 'Test Planet',
                  theme: 'blue',
                  summary: 'A test planet',
                  contentMarkdown: '# Test Planet',
                  moons: [
                    {
                      id: 'test-moon',
                      name: 'Test Moon',
                      contentMarkdown: '# Test Moon',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  });

  describe('generateId', () => {
    it('should convert name to kebab-case', () => {
      expect(generateId('Milky Way')).toBe('milky-way');
      expect(generateId('Andromeda Galaxy')).toBe('andromeda-galaxy');
    });

    it('should handle special characters', () => {
      expect(generateId('Planet X-1')).toBe('planet-x-1');
      expect(generateId('Moon #42')).toBe('moon-42');
    });

    it('should handle multiple spaces', () => {
      expect(generateId('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });

    it('should return empty string for empty input', () => {
      expect(generateId('')).toBe('');
      expect(generateId('   ')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(generateId('Café Galaxy')).toBe('cafe-galaxy');
      expect(generateId('São Paulo')).toBe('sao-paulo');
      expect(generateId('Ñoño System')).toBe('nono-system');
    });

    it('should handle mixed case and symbols', () => {
      expect(generateId('The "Great" Galaxy!')).toBe('the-great-galaxy');
      expect(generateId('Galaxy @#$%^& 42')).toBe('galaxy-42');
    });
  });

  describe('ensureGalaxyId', () => {
    it('should keep existing non-empty ID', () => {
      const galaxy: Galaxy = {
        id: 'custom-id',
        name: 'Test Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000',
        stars: [],
        solarSystems: [],
      };
      
      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('custom-id');
    });

    it('should generate ID from name when ID is empty', () => {
      const galaxy: Galaxy = {
        id: '',
        name: 'Andromeda Galaxy',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000',
        stars: [],
        solarSystems: [],
      };
      
      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('andromeda-galaxy');
    });

    it('should generate ID from name when ID is whitespace', () => {
      const galaxy: Galaxy = {
        id: '   ',
        name: 'Milky Way',
        description: 'Test',
        theme: 'blue',
        particleColor: '#000',
        stars: [],
        solarSystems: [],
      };
      
      const result = ensureGalaxyId(galaxy);
      expect(result.id).toBe('milky-way');
    });
  });

  describe('isIdUnique', () => {
    it('should return true for unique galaxy ID', () => {
      expect(isIdUnique(testUniverse, 'new-galaxy', 'galaxy')).toBe(true);
    });

    it('should return false for existing galaxy ID', () => {
      expect(isIdUnique(testUniverse, 'test-galaxy', 'galaxy')).toBe(false);
    });

    it('should return true for unique solar system ID', () => {
      expect(isIdUnique(testUniverse, 'new-system', 'solarSystem')).toBe(true);
    });

    it('should return false for existing solar system ID', () => {
      expect(isIdUnique(testUniverse, 'test-system', 'solarSystem')).toBe(false);
    });
  });

  describe('getAllIds', () => {
    it('should get all galaxy IDs', () => {
      const ids = getAllIds(testUniverse, 'galaxy');
      expect(ids).toEqual(['test-galaxy']);
    });

    it('should get all solar system IDs', () => {
      const ids = getAllIds(testUniverse, 'solarSystem');
      expect(ids).toEqual(['test-system']);
    });

    it('should get all planet IDs', () => {
      const ids = getAllIds(testUniverse, 'planet');
      expect(ids).toEqual(['test-planet']);
    });

    it('should get all moon IDs', () => {
      const ids = getAllIds(testUniverse, 'moon');
      expect(ids).toEqual(['test-moon']);
    });

    it('should get all star IDs', () => {
      const ids = getAllIds(testUniverse, 'star');
      expect(ids).toContain('test-star');
      expect(ids).toContain('main-star');
    });
  });

  describe('Galaxy mutations', () => {
    it('should create a new galaxy', () => {
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
      expect(result.galaxies[1]).toEqual(newGalaxy);
    });

    it('should auto-generate ID from name when ID is empty', () => {
      const newGalaxy: Galaxy = {
        id: '',
        name: 'Andromeda Galaxy',
        description: 'A new galaxy',
        theme: 'purple',
        particleColor: '#9B59B6',
        stars: [],
        solarSystems: [],
      };

      const result = createGalaxy(testUniverse, newGalaxy);
      expect(result.galaxies).toHaveLength(2);
      expect(result.galaxies[1].id).toBe('andromeda-galaxy');
      expect(result.galaxies[1].name).toBe('Andromeda Galaxy');
    });

    it('should auto-generate ID from name when ID is whitespace', () => {
      const newGalaxy: Galaxy = {
        id: '   ',
        name: 'Triangulum Galaxy',
        description: 'A new galaxy',
        theme: 'blue',
        particleColor: '#4A90E2',
        stars: [],
        solarSystems: [],
      };

      const result = createGalaxy(testUniverse, newGalaxy);
      expect(result.galaxies).toHaveLength(2);
      expect(result.galaxies[1].id).toBe('triangulum-galaxy');
    });

    it('should throw error for missing name', () => {
      const invalidGalaxy: Galaxy = {
        id: 'invalid',
        name: '',
        description: 'A galaxy',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow(
        'Galaxy name is required'
      );
    });

    it('should throw error for missing description', () => {
      const invalidGalaxy: Galaxy = {
        id: 'invalid',
        name: 'Invalid Galaxy',
        description: '',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow(
        'Galaxy description is required'
      );
    });

    it('should throw error for duplicate galaxy ID', () => {
      const duplicateGalaxy: Galaxy = {
        id: 'test-galaxy',
        name: 'Duplicate',
        description: 'Duplicate',
        theme: 'blue',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      expect(() => createGalaxy(testUniverse, duplicateGalaxy)).toThrow(
        "Galaxy ID 'test-galaxy' already exists"
      );
    });

    it('should update a galaxy', () => {
      const result = updateGalaxy(testUniverse, 'test-galaxy', {
        name: 'Updated Galaxy',
        description: 'Updated description',
      });

      expect(result.galaxies[0].name).toBe('Updated Galaxy');
      expect(result.galaxies[0].description).toBe('Updated description');
      expect(result.galaxies[0].id).toBe('test-galaxy');
    });

    it('should delete a galaxy', () => {
      const result = deleteGalaxy(testUniverse, 'test-galaxy');
      expect(result.galaxies).toHaveLength(0);
    });

    it('should throw error when updating non-existent galaxy', () => {
      expect(() => updateGalaxy(testUniverse, 'non-existent', { name: 'Test' })).toThrow(
        "Galaxy 'non-existent' not found"
      );
    });
  });

  describe('Solar System mutations', () => {
    it('should create a new solar system', () => {
      const newSystem: SolarSystem = {
        id: 'new-system',
        name: 'New System',
        theme: 'red',
        mainStar: {
          id: 'new-star',
          name: 'New Star',
          theme: 'red-giant',
        },
        planets: [],
      };

      const result = createSolarSystem(testUniverse, 'test-galaxy', newSystem);
      expect(result.galaxies[0].solarSystems).toHaveLength(2);
    });

    it('should update a solar system', () => {
      const result = updateSolarSystem(testUniverse, 'test-galaxy', 'test-system', {
        name: 'Updated System',
      });

      expect(result.galaxies[0].solarSystems![0].name).toBe('Updated System');
    });

    it('should delete a solar system', () => {
      const result = deleteSolarSystem(testUniverse, 'test-galaxy', 'test-system');
      expect(result.galaxies[0].solarSystems).toHaveLength(0);
    });
  });

  describe('Planet mutations', () => {
    it('should create a new planet', () => {
      const newPlanet: Planet = {
        id: 'new-planet',
        name: 'New Planet',
        theme: 'red',
        summary: 'A new planet',
        contentMarkdown: '# New Planet',
        moons: [],
      };

      const result = createPlanet(testUniverse, 'test-galaxy', 'test-system', newPlanet);
      expect(result.galaxies[0].solarSystems![0].planets).toHaveLength(2);
    });

    it('should update a planet', () => {
      const result = updatePlanet(testUniverse, 'test-galaxy', 'test-system', 'test-planet', {
        name: 'Updated Planet',
        summary: 'Updated summary',
      });

      expect(result.galaxies[0].solarSystems![0].planets![0].name).toBe('Updated Planet');
      expect(result.galaxies[0].solarSystems![0].planets![0].summary).toBe('Updated summary');
    });

    it('should delete a planet', () => {
      const result = deletePlanet(testUniverse, 'test-galaxy', 'test-system', 'test-planet');
      expect(result.galaxies[0].solarSystems![0].planets).toHaveLength(0);
    });
  });

  describe('Moon mutations', () => {
    it('should create a new moon', () => {
      const newMoon: Moon = {
        id: 'new-moon',
        name: 'New Moon',
        contentMarkdown: '# New Moon',
      };

      const result = createMoon(
        testUniverse,
        'test-galaxy',
        'test-system',
        'test-planet',
        newMoon
      );
      expect(result.galaxies[0].solarSystems![0].planets![0].moons).toHaveLength(2);
    });

    it('should update a moon', () => {
      const result = updateMoon(
        testUniverse,
        'test-galaxy',
        'test-system',
        'test-planet',
        'test-moon',
        {
          name: 'Updated Moon',
          contentMarkdown: '# Updated Moon Content',
        }
      );

      const moon = result.galaxies[0].solarSystems![0].planets![0].moons![0];
      expect(moon.name).toBe('Updated Moon');
      expect(moon.contentMarkdown).toBe('# Updated Moon Content');
    });

    it('should delete a moon', () => {
      const result = deleteMoon(
        testUniverse,
        'test-galaxy',
        'test-system',
        'test-planet',
        'test-moon'
      );
      expect(result.galaxies[0].solarSystems![0].planets![0].moons).toHaveLength(0);
    });
  });

  describe('Star mutations', () => {
    it('should create a new star', () => {
      const newStar: Star = {
        id: 'new-star',
        name: 'New Star',
        theme: 'blue-giant',
      };

      const result = createStar(testUniverse, 'test-galaxy', newStar);
      expect(result.galaxies[0].stars).toHaveLength(2);
    });

    it('should update a star', () => {
      const result = updateStar(testUniverse, 'test-galaxy', 'test-star', {
        name: 'Updated Star',
        theme: 'red-dwarf',
      });

      expect(result.galaxies[0].stars![0].name).toBe('Updated Star');
      expect(result.galaxies[0].stars![0].theme).toBe('red-dwarf');
    });

    it('should delete a star', () => {
      const result = deleteStar(testUniverse, 'test-galaxy', 'test-star');
      expect(result.galaxies[0].stars).toHaveLength(0);
    });
  });

  describe('serializeUniverse', () => {
    it('should serialize universe to JSON', () => {
      const json = serializeUniverse(testUniverse);
      expect(json).toContain('"galaxies"');
      expect(json).toContain('"test-galaxy"');
      expect(JSON.parse(json)).toEqual(testUniverse);
    });
  });

  describe('parseAndValidateUniverse', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify(testUniverse);
      const result = parseAndValidateUniverse(json);
      
      expect(result.universe).toEqual(testUniverse);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid JSON', () => {
      const result = parseAndValidateUniverse('{ invalid json');
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should validate universe structure', () => {
      const invalidUniverse = { galaxies: [{ id: '', name: '', description: '', theme: '', particleColor: '' }] };
      const json = JSON.stringify(invalidUniverse);
      const result = parseAndValidateUniverse(json);
      
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
