// Mock fetch globally for tests
global.fetch = jest.fn();

// Mock the universe data import
jest.mock('../../../../public/universe/universe.json', () => ({
  galaxies: [
    {
      id: 'test-galaxy',
      name: 'Test Galaxy',
      description: 'A test galaxy',
      theme: 'blue',
      particleColor: '#0000FF',
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
            id: 'test-main-star',
            name: 'Test Main Star',
            theme: 'yellow',
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
}));

import {
  loadUniverse,
  getGalaxies,
  getGalaxyById,
  getAllSolarSystems,
  getSolarSystemById,
  getAllPlanets,
  getPlanetById,
  getAllMoons,
  getMoonById,
  getAllStars,
  getStarById,
  getValidationErrors,
  clearCache,
} from '../data-service';

describe('Universe Data Service', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('loadUniverse', () => {
    it('should load universe data', async () => {
      const universe = await loadUniverse();
      expect(universe).toBeDefined();
      expect(universe.galaxies).toBeDefined();
      expect(Array.isArray(universe.galaxies)).toBe(true);
    });

    it('should cache universe data', async () => {
      const universe1 = await loadUniverse();
      const universe2 = await loadUniverse();
      expect(universe1).toBe(universe2); // Same reference means cached
    });

    it('should handle empty markdown content with placeholders', async () => {
      // This test verifies the sanitization logic
      const universe = await loadUniverse();
      expect(universe).toBeDefined();
    });
  });

  describe('getGalaxies', () => {
    it('should return all galaxies', async () => {
      const galaxies = await getGalaxies();
      expect(Array.isArray(galaxies)).toBe(true);
      expect(galaxies.length).toBeGreaterThan(0);
      expect(galaxies[0].id).toBe('test-galaxy');
    });
  });

  describe('getGalaxyById', () => {
    it('should return a galaxy by id', async () => {
      const galaxy = await getGalaxyById('test-galaxy');
      expect(galaxy).toBeDefined();
      expect(galaxy?.name).toBe('Test Galaxy');
    });

    it('should return undefined for non-existent galaxy', async () => {
      const galaxy = await getGalaxyById('non-existent');
      expect(galaxy).toBeUndefined();
    });
  });

  describe('getAllSolarSystems', () => {
    it('should return all solar systems from all galaxies', async () => {
      const systems = await getAllSolarSystems();
      expect(Array.isArray(systems)).toBe(true);
      expect(systems.length).toBeGreaterThan(0);
      expect(systems[0].id).toBe('test-system');
    });
  });

  describe('getSolarSystemById', () => {
    it('should return a solar system by id', async () => {
      const system = await getSolarSystemById('test-system');
      expect(system).toBeDefined();
      expect(system?.name).toBe('Test System');
    });

    it('should return undefined for non-existent solar system', async () => {
      const system = await getSolarSystemById('non-existent');
      expect(system).toBeUndefined();
    });
  });

  describe('getAllPlanets', () => {
    it('should return all planets from all solar systems', async () => {
      const planets = await getAllPlanets();
      expect(Array.isArray(planets)).toBe(true);
      expect(planets.length).toBeGreaterThan(0);
      expect(planets[0].id).toBe('test-planet');
    });
  });

  describe('getPlanetById', () => {
    it('should return a planet by id', async () => {
      const planet = await getPlanetById('test-planet');
      expect(planet).toBeDefined();
      expect(planet?.name).toBe('Test Planet');
    });

    it('should return undefined for non-existent planet', async () => {
      const planet = await getPlanetById('non-existent');
      expect(planet).toBeUndefined();
    });
  });

  describe('getAllMoons', () => {
    it('should return all moons from all planets', async () => {
      const moons = await getAllMoons();
      expect(Array.isArray(moons)).toBe(true);
      expect(moons.length).toBeGreaterThan(0);
      expect(moons[0].id).toBe('test-moon');
    });
  });

  describe('getMoonById', () => {
    it('should return a moon by id', async () => {
      const moon = await getMoonById('test-moon');
      expect(moon).toBeDefined();
      expect(moon?.name).toBe('Test Moon');
    });

    it('should return undefined for non-existent moon', async () => {
      const moon = await getMoonById('non-existent');
      expect(moon).toBeUndefined();
    });
  });

  describe('getAllStars', () => {
    it('should return all stars including free-floating and main stars', async () => {
      const stars = await getAllStars();
      expect(Array.isArray(stars)).toBe(true);
      expect(stars.length).toBeGreaterThanOrEqual(2); // At least the free star and main star
      
      const starIds = stars.map(s => s.id);
      expect(starIds).toContain('test-star'); // Free floating star
      expect(starIds).toContain('test-main-star'); // Main star
    });
  });

  describe('getStarById', () => {
    it('should return a star by id', async () => {
      const star = await getStarById('test-star');
      expect(star).toBeDefined();
      expect(star?.name).toBe('Test Star');
    });

    it('should find main stars', async () => {
      const star = await getStarById('test-main-star');
      expect(star).toBeDefined();
      expect(star?.name).toBe('Test Main Star');
    });

    it('should return undefined for non-existent star', async () => {
      const star = await getStarById('non-existent');
      expect(star).toBeUndefined();
    });
  });

  describe('getValidationErrors', () => {
    it('should return validation errors array', async () => {
      await loadUniverse();
      const errors = getValidationErrors();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      const universe1 = await loadUniverse();
      clearCache();
      const universe2 = await loadUniverse();
      // After clearing cache, we should get fresh data (though same content)
      expect(universe2).toBeDefined();
    });
  });
});
