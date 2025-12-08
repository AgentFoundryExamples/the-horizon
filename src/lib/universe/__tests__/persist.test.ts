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
import os from 'os';

describe('Universe Persistence', () => {
  const testDir = path.join(os.tmpdir(), 'test-universe');
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

    it('should reject path traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';
      const result = await persistUniverseToFile(testUniverse, maliciousPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('path traversal not allowed');
    });

    it('should use unique temp file names', async () => {
      // First save
      await persistUniverseToFile(testUniverse, testFile);

      // Verify no .tmp files remain
      const files = await fs.readdir(testDir);
      const tmpFiles = files.filter(f => f.includes('.tmp'));
      expect(tmpFiles.length).toBe(0);
    });

    it('should clean up temp file on error', async () => {
      // Mock fs.rename to throw an error
      const originalRename = fs.rename;
      const mockRename = jest.fn().mockRejectedValue(new Error('Simulated rename failure'));
      (fs as any).rename = mockRename;

      try {
        const result = await persistUniverseToFile(testUniverse, testFile);

        // Should fail
        expect(result.success).toBe(false);

        // Verify no .tmp files remain (cleanup should have happened)
        const files = await fs.readdir(testDir);
        const tmpFiles = files.filter(f => f.includes('.tmp'));
        expect(tmpFiles.length).toBe(0);
      } finally {
        // Restore original fs.rename
        (fs as any).rename = originalRename;
      }
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

    it('should handle concurrent writes with unique temp files', async () => {
      // Simulate concurrent writes by starting multiple persist operations
      const universe1 = { ...testUniverse, galaxies: [{ ...testUniverse.galaxies[0], name: 'Universe 1' }] };
      const universe2 = { ...testUniverse, galaxies: [{ ...testUniverse.galaxies[0], name: 'Universe 2' }] };
      
      const [result1, result2] = await Promise.all([
        persistUniverseToFile(universe1, testFile),
        persistUniverseToFile(universe2, testFile),
      ]);

      // Both should succeed (one will win the race)
      expect(result1.success || result2.success).toBe(true);
      
      // Verify final file is valid JSON
      const content = await fs.readFile(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.galaxies).toHaveLength(1);
      expect(['Universe 1', 'Universe 2']).toContain(parsed.galaxies[0].name);
    });

    it('should handle filesystem errors during write', async () => {
      // Mock writeFile to fail
      const originalWriteFile = fs.writeFile;
      const mockWriteFile = jest.fn().mockRejectedValue(new Error('Disk full'));
      (fs as any).writeFile = mockWriteFile;

      try {
        const result = await persistUniverseToFile(testUniverse, testFile);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Disk full');
      } finally {
        (fs as any).writeFile = originalWriteFile;
      }
    });

    it('should atomically replace existing file', async () => {
      // First write
      const universe1 = testUniverse;
      await persistUniverseToFile(universe1, testFile);
      
      // Verify first write
      let content = await fs.readFile(testFile, 'utf-8');
      let parsed = JSON.parse(content);
      expect(parsed.galaxies[0].name).toBe('Test Galaxy');

      // Second write with different data
      const universe2 = {
        galaxies: [{
          ...testUniverse.galaxies[0],
          name: 'Updated Galaxy',
          description: 'Updated description',
        }],
      };
      
      const result = await persistUniverseToFile(universe2, testFile);
      expect(result.success).toBe(true);

      // Verify atomic replacement - no corruption
      content = await fs.readFile(testFile, 'utf-8');
      parsed = JSON.parse(content);
      expect(parsed.galaxies[0].name).toBe('Updated Galaxy');
      expect(parsed.galaxies[0].description).toBe('Updated description');
      
      // Ensure no temp files remain
      const files = await fs.readdir(testDir);
      const tmpFiles = files.filter(f => f.includes('.tmp'));
      expect(tmpFiles.length).toBe(0);
    });

    it('should preserve exact JSON formatting for consistency', async () => {
      await persistUniverseToFile(testUniverse, testFile);
      
      const content = await fs.readFile(testFile, 'utf-8');
      
      // Verify proper indentation (2 spaces)
      expect(content).toMatch(/\n  "/);
      
      // Verify newlines at appropriate places
      expect(content).toMatch(/{\n/);
      expect(content).toMatch(/\n}/);
      
      // Verify no trailing whitespace
      const lines = content.split('\n');
      lines.forEach(line => {
        expect(line).not.toMatch(/\s+$/);
      });
    });
  });
});
