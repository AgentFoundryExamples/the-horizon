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

import { persistUniverseToFile } from '../persist';
import type { Universe } from '../types';
import fs from 'fs/promises';
import path from 'path';

describe('Universe Persistence', () => {
  const testDir = '/tmp/test-universe';
  const testFile = path.join(testDir, 'universe.json');

  let testUniverse: Universe;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    testUniverse = {
      galaxies: [
        {
          id: 'test-galaxy',
          name: 'Test Galaxy',
          description: 'A test galaxy',
          theme: 'blue-white',
          particleColor: '#4A90E2',
          stars: [],
          solarSystems: [],
        },
      ],
    };
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  describe('persistUniverseToFile', () => {
    it('should successfully persist valid universe data', async () => {
      const result = await persistUniverseToFile(testUniverse, testFile);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify file was created
      const content = await fs.readFile(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testUniverse);
    });

    it('should create parent directory if it does not exist', async () => {
      const nestedFile = path.join(testDir, 'nested', 'deep', 'universe.json');
      const result = await persistUniverseToFile(testUniverse, nestedFile);

      expect(result.success).toBe(true);

      // Verify file was created
      const content = await fs.readFile(nestedFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testUniverse);
    });

    it('should write pretty-formatted JSON', async () => {
      await persistUniverseToFile(testUniverse, testFile);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  '); // Indentation
    });

    it('should reject invalid universe data', async () => {
      const invalidUniverse = {
        galaxies: [
          {
            // Missing required fields
            id: '',
            name: '',
          },
        ],
      } as unknown as Universe;

      const result = await persistUniverseToFile(invalidUniverse, testFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should overwrite existing file', async () => {
      // First write
      await persistUniverseToFile(testUniverse, testFile);

      // Update universe
      const updatedUniverse = {
        ...testUniverse,
        galaxies: [
          ...testUniverse.galaxies,
          {
            id: 'second-galaxy',
            name: 'Second Galaxy',
            description: 'Another galaxy',
            theme: 'red',
            particleColor: '#FF0000',
            stars: [],
            solarSystems: [],
          },
        ],
      };

      // Second write
      const result = await persistUniverseToFile(updatedUniverse, testFile);

      expect(result.success).toBe(true);

      // Verify file was updated
      const content = await fs.readFile(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.galaxies).toHaveLength(2);
      expect(parsed).toEqual(updatedUniverse);
    });

    it('should handle write errors gracefully', async () => {
      // Try to write to a path that will fail (e.g., a file that exists as a directory)
      await fs.mkdir(testFile, { recursive: true });

      const result = await persistUniverseToFile(testUniverse, testFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should persist complex universe with all entity types', async () => {
      const complexUniverse: Universe = {
        galaxies: [
          {
            id: 'milky-way',
            name: 'Milky Way',
            description: 'Our home galaxy',
            theme: 'blue-white',
            particleColor: '#4A90E2',
            stars: [
              {
                id: 'polaris',
                name: 'Polaris',
                theme: 'yellow-white',
              },
            ],
            solarSystems: [
              {
                id: 'sol-system',
                name: 'Sol System',
                theme: 'yellow-star',
                mainStar: {
                  id: 'sol',
                  name: 'Sol',
                  theme: 'yellow-dwarf',
                },
                planets: [
                  {
                    id: 'earth',
                    name: 'Earth',
                    theme: 'blue-green',
                    summary: 'Our home planet',
                    contentMarkdown: '# Earth\n\nOur home.',
                    moons: [
                      {
                        id: 'luna',
                        name: 'Luna',
                        contentMarkdown: '# Luna\n\nThe Moon.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await persistUniverseToFile(complexUniverse, testFile);

      expect(result.success).toBe(true);

      // Verify all data was persisted correctly
      const content = await fs.readFile(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(complexUniverse);
      expect(parsed.galaxies[0].stars).toHaveLength(1);
      expect(parsed.galaxies[0].solarSystems[0].planets[0].moons).toHaveLength(1);
    });
  });
});
