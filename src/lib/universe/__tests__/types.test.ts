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
  validateMoon,
  validatePlanet,
  validateStar,
  validateSolarSystem,
  validateGalaxy,
  validateUniverse,
} from '../types';
import type { Moon, Planet, Star, SolarSystem, Galaxy, Universe } from '../types';

describe('Universe Type Validation', () => {
  describe('validateMoon', () => {
    it('should validate a valid moon', () => {
      const moon: Moon = {
        id: 'luna',
        name: 'Luna',
        contentMarkdown: '# Luna\n\nEarth\'s only natural satellite.',
      };

      const result = validateMoon(moon, 'Test Moon');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when id is missing', () => {
      const moon = {
        id: '',
        name: 'Luna',
        contentMarkdown: 'Content',
      } as Moon;

      const result = validateMoon(moon, 'Test Moon');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test Moon: Moon id is required');
    });

    it('should fail when name is missing', () => {
      const moon = {
        id: 'luna',
        name: '',
        contentMarkdown: 'Content',
      } as Moon;

      const result = validateMoon(moon, 'Test Moon');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test Moon: Moon name is required');
    });

    it('should fail when contentMarkdown is missing', () => {
      const moon = {
        id: 'luna',
        name: 'Luna',
        contentMarkdown: '',
      } as Moon;

      const result = validateMoon(moon, 'Test Moon');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('contentMarkdown'))).toBe(true);
    });
  });

  describe('validatePlanet', () => {
    const validMoon: Moon = {
      id: 'luna',
      name: 'Luna',
      contentMarkdown: 'Moon content',
    };

    it('should validate a valid planet with moons', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'The third planet',
        contentMarkdown: '# Earth\n\nOur home.',
        moons: [validMoon],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a planet without moons', () => {
      const planet: Planet = {
        id: 'mercury',
        name: 'Mercury',
        theme: 'grey',
        summary: 'The first planet',
        contentMarkdown: '# Mercury',
        moons: [],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(true);
    });

    it('should fail when required fields are missing', () => {
      const planet = {
        id: '',
        name: '',
        theme: '',
        summary: '',
        contentMarkdown: '',
        moons: [],
      } as Planet;

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should cascade validation to moons', () => {
      const invalidMoon = { id: '', name: '', contentMarkdown: '' } as Moon;
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue',
        summary: 'Summary',
        contentMarkdown: 'Content',
        moons: [invalidMoon],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateStar', () => {
    it('should validate a valid star', () => {
      const star: Star = {
        id: 'sol',
        name: 'Sol',
        theme: 'yellow-dwarf',
      };

      const result = validateStar(star, 'Test Star');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required fields are missing', () => {
      const star = {
        id: '',
        name: '',
        theme: '',
      } as Star;

      const result = validateStar(star, 'Test Star');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });

  describe('validateSolarSystem', () => {
    const validStar: Star = {
      id: 'sol',
      name: 'Sol',
      theme: 'yellow-dwarf',
    };

    const validPlanet: Planet = {
      id: 'earth',
      name: 'Earth',
      theme: 'blue-green',
      summary: 'Summary',
      contentMarkdown: 'Content',
      moons: [],
    };

    it('should validate a valid solar system', () => {
      const solarSystem: SolarSystem = {
        id: 'sol-system',
        name: 'Sol System',
        theme: 'yellow-star',
        mainStar: validStar,
        planets: [validPlanet],
      };

      const result = validateSolarSystem(solarSystem, 'Test System');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when mainStar is missing', () => {
      const solarSystem = {
        id: 'sol-system',
        name: 'Sol System',
        theme: 'yellow-star',
        mainStar: null,
        planets: [],
      } as any;

      const result = validateSolarSystem(solarSystem, 'Test System');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('mainStar is required'))).toBe(true);
    });
  });

  describe('validateGalaxy', () => {
    const validStar: Star = {
      id: 'polaris',
      name: 'Polaris',
      theme: 'yellow-white',
    };

    const validSolarSystem: SolarSystem = {
      id: 'sol-system',
      name: 'Sol System',
      theme: 'yellow-star',
      mainStar: validStar,
      planets: [],
    };

    it('should validate a valid galaxy', () => {
      const galaxy: Galaxy = {
        id: 'milky-way',
        name: 'Milky Way',
        description: 'Our home galaxy',
        theme: 'blue-white',
        particleColor: '#4A90E2',
        stars: [validStar],
        solarSystems: [validSolarSystem],
      };

      const result = validateGalaxy(galaxy, 'Test Galaxy');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a galaxy with no stars or solar systems', () => {
      const galaxy: Galaxy = {
        id: 'empty-galaxy',
        name: 'Empty Galaxy',
        description: 'A lonely galaxy',
        theme: 'dark',
        particleColor: '#000000',
        stars: [],
        solarSystems: [],
      };

      const result = validateGalaxy(galaxy, 'Test Galaxy');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUniverse', () => {
    it('should validate a valid universe', () => {
      const universe: Universe = {
        galaxies: [
          {
            id: 'milky-way',
            name: 'Milky Way',
            description: 'Our home',
            theme: 'blue',
            particleColor: '#4A90E2',
            stars: [],
            solarSystems: [],
          },
        ],
      };

      const result = validateUniverse(universe);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate an empty universe', () => {
      const universe: Universe = {
        galaxies: [],
      };

      const result = validateUniverse(universe);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when galaxies is not an array', () => {
      const universe = {
        galaxies: null,
      } as any;

      const result = validateUniverse(universe);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Universe must contain a galaxies array');
    });
  });
});
