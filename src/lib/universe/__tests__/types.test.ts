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
  validateExternalLink,
  checkDuplicateLinks,
} from '../types';
import type { Moon, Planet, Star, SolarSystem, Galaxy, Universe, ExternalLink } from '../types';

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

    it('should validate a planet with valid external links', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'NASA',
            url: 'https://www.nasa.gov',
            description: 'Space agency',
          },
          {
            title: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Earth',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when external link has missing title', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: '',
            url: 'https://www.nasa.gov',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Link title is required'))).toBe(true);
    });

    it('should fail when external link has missing URL', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'NASA',
            url: '',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Link URL is required'))).toBe(true);
    });

    it('should fail when external link has invalid URL', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'Invalid',
            url: 'not-a-valid-url',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not a valid URL'))).toBe(true);
    });

    it('should fail when external link has invalid protocol', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'FTP Link',
            url: 'ftp://example.com',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('http or https protocol'))).toBe(true);
    });

    it('should fail when external links have duplicate URLs', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'NASA',
            url: 'https://www.nasa.gov',
          },
          {
            title: 'NASA Duplicate',
            url: 'https://www.nasa.gov',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate URL'))).toBe(true);
    });

    it('should detect duplicate URLs case-insensitively', () => {
      const planet: Planet = {
        id: 'earth',
        name: 'Earth',
        theme: 'blue-green',
        summary: 'Home planet',
        contentMarkdown: '# Earth',
        moons: [],
        externalLinks: [
          {
            title: 'NASA',
            url: 'https://www.nasa.gov',
          },
          {
            title: 'NASA Case',
            url: 'HTTPS://WWW.NASA.GOV',
          },
        ],
      };

      const result = validatePlanet(planet, 'Test Planet');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate URL'))).toBe(true);
    });
  });

  describe('validateExternalLink', () => {
    it('should validate a valid external link', () => {
      const link: ExternalLink = {
        title: 'NASA',
        url: 'https://www.nasa.gov',
        description: 'Space agency',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a link without description', () => {
      const link: ExternalLink = {
        title: 'NASA',
        url: 'https://www.nasa.gov',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when title is missing', () => {
      const link: ExternalLink = {
        title: '',
        url: 'https://www.nasa.gov',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test Link: Link title is required');
    });

    it('should fail when URL is missing', () => {
      const link: ExternalLink = {
        title: 'NASA',
        url: '',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test Link: Link URL is required');
    });

    it('should fail when URL is invalid', () => {
      const link: ExternalLink = {
        title: 'Invalid',
        url: 'not-a-url',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not a valid URL'))).toBe(true);
    });

    it('should fail when URL uses non-http protocol', () => {
      const link: ExternalLink = {
        title: 'FTP',
        url: 'ftp://example.com',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('http or https protocol'))).toBe(true);
    });

    it('should allow http protocol', () => {
      const link: ExternalLink = {
        title: 'HTTP Link',
        url: 'http://example.com',
      };

      const result = validateExternalLink(link, 'Test Link');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('checkDuplicateLinks', () => {
    it('should return no errors for unique links', () => {
      const links: ExternalLink[] = [
        { title: 'NASA', url: 'https://www.nasa.gov' },
        { title: 'ESA', url: 'https://www.esa.int' },
        { title: 'SpaceX', url: 'https://www.spacex.com' },
      ];

      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors).toHaveLength(0);
    });

    it('should detect exact duplicate URLs', () => {
      const links: ExternalLink[] = [
        { title: 'NASA', url: 'https://www.nasa.gov' },
        { title: 'NASA Again', url: 'https://www.nasa.gov' },
      ];

      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Duplicate URL at index 1');
      expect(errors[0]).toContain('first seen at index 0');
    });

    it('should detect case-insensitive duplicates', () => {
      const links: ExternalLink[] = [
        { title: 'NASA', url: 'https://www.nasa.gov' },
        { title: 'NASA Upper', url: 'HTTPS://WWW.NASA.GOV' },
      ];

      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Duplicate URL');
    });

    it('should detect multiple duplicates', () => {
      const links: ExternalLink[] = [
        { title: 'NASA', url: 'https://www.nasa.gov' },
        { title: 'NASA 2', url: 'https://www.nasa.gov' },
        { title: 'NASA 3', url: 'https://www.nasa.gov' },
        { title: 'ESA', url: 'https://www.esa.int' },
        { title: 'ESA 2', url: 'https://www.esa.int' },
      ];

      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty links array', () => {
      const links: ExternalLink[] = [];
      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors).toHaveLength(0);
    });

    it('should handle links with empty URLs', () => {
      const links: ExternalLink[] = [
        { title: 'NASA', url: 'https://www.nasa.gov' },
        { title: 'Empty', url: '' },
        { title: 'ESA', url: 'https://www.esa.int' },
      ];

      const errors = checkDuplicateLinks(links, 'Test');
      expect(errors).toHaveLength(0);
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
