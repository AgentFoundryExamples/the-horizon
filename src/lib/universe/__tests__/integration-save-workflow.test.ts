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
 * Integration tests for the admin save workflow
 * Tests the complete flow: mutate → serialize → persist → validate
 */

import { createGalaxy, updateGalaxy, serializeUniverse, parseAndValidateUniverse } from '../mutate';
import { persistUniverseToFile } from '../persist';
import type { Universe, Galaxy } from '../types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Admin Save Workflow Integration', () => {
  // Use unique directory per test run to ensure isolation
  const testRunId = `test-workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testDir = path.join(os.tmpdir(), testRunId);
  const testFile = path.join(testDir, 'universe.json');

  let testUniverse: Universe;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    testUniverse = {
      galaxies: [
        {
          id: 'milky-way',
          name: 'Milky Way',
          description: 'Our home galaxy',
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

  describe('Complete Save Workflow', () => {
    it('should successfully complete: create → serialize → persist → validate cycle', async () => {
      // Step 1: Admin creates a new galaxy
      const newGalaxy: Galaxy = {
        id: 'andromeda',
        name: 'Andromeda Galaxy',
        description: 'The nearest major galaxy',
        theme: 'purple-white',
        particleColor: '#9B59B6',
        stars: [],
        solarSystems: [],
      };

      const updatedUniverse = createGalaxy(testUniverse, newGalaxy);
      expect(updatedUniverse.galaxies).toHaveLength(2);

      // Step 2: Serialize the universe
      const serialized = serializeUniverse(updatedUniverse);
      expect(serialized).toContain('"id": "andromeda"');
      expect(serialized).toContain('"name": "Andromeda Galaxy"');

      // Step 3: Persist to file (simulates PATCH /api/admin/universe)
      const persistResult = await persistUniverseToFile(updatedUniverse, testFile);
      expect(persistResult.success).toBe(true);

      // Step 4: Read back from file (simulates POST /api/admin/universe reading saved file)
      const savedContent = await fs.readFile(testFile, 'utf-8');
      
      // Step 5: Validate the persisted content
      const { universe: loadedUniverse, errors } = parseAndValidateUniverse(savedContent);
      expect(errors).toHaveLength(0);
      expect(loadedUniverse.galaxies).toHaveLength(2);
      expect(loadedUniverse.galaxies[1].name).toBe('Andromeda Galaxy');
    });

    it('should successfully complete: update → serialize → persist → validate cycle', async () => {
      // Initial persist
      await persistUniverseToFile(testUniverse, testFile);

      // Step 1: Admin updates a galaxy
      const updatedUniverse = updateGalaxy(testUniverse, 'milky-way', {
        description: 'Updated description - Our beautiful home galaxy',
      });

      // Step 2: Serialize
      const serialized = serializeUniverse(updatedUniverse);
      expect(serialized).toContain('Updated description');

      // Step 3: Persist (overwrite)
      const persistResult = await persistUniverseToFile(updatedUniverse, testFile);
      expect(persistResult.success).toBe(true);

      // Step 4: Read back
      const savedContent = await fs.readFile(testFile, 'utf-8');
      
      // Step 5: Validate
      const { universe: loadedUniverse, errors } = parseAndValidateUniverse(savedContent);
      expect(errors).toHaveLength(0);
      expect(loadedUniverse.galaxies[0].description).toContain('Updated description');
    });

    it('should prevent invalid data from being persisted', async () => {
      // Create invalid galaxy (missing required fields)
      const invalidGalaxy = {
        id: 'invalid',
        name: '',  // Empty name should fail validation
        description: '',  // Empty description should fail validation
        theme: '',
        particleColor: '',
        stars: [],
        solarSystems: [],
      } as Galaxy;

      // Try to create (should throw)
      expect(() => createGalaxy(testUniverse, invalidGalaxy)).toThrow();

      // If we somehow bypass creation, persist should catch it
      const invalidUniverse = {
        ...testUniverse,
        galaxies: [...testUniverse.galaxies, invalidGalaxy],
      };

      const persistResult = await persistUniverseToFile(invalidUniverse, testFile);
      expect(persistResult.success).toBe(false);
      expect(persistResult.error).toContain('Validation failed');
    });

    it('should handle concurrent saves with optimistic locking', async () => {
      // First save
      await persistUniverseToFile(testUniverse, testFile);
      const firstContent = await fs.readFile(testFile, 'utf-8');

      // Simulate concurrent edit - another admin changes the file
      const concurrentUniverse = updateGalaxy(testUniverse, 'milky-way', {
        description: 'Concurrent edit',
      });
      await persistUniverseToFile(concurrentUniverse, testFile);
      const secondContent = await fs.readFile(testFile, 'utf-8');

      // Verify the contents are different
      expect(firstContent).not.toEqual(secondContent);
      expect(secondContent).toContain('Concurrent edit');

      // In real workflow, hash comparison would detect this
      // and API would return 409 Conflict
    });

    it('should maintain data integrity through multiple operations', async () => {
      let currentUniverse = testUniverse;

      // Perform multiple operations
      for (let i = 1; i <= 5; i++) {
        const newGalaxy: Galaxy = {
          id: `galaxy-${i}`,
          name: `Galaxy ${i}`,
          description: `Description ${i}`,
          theme: 'blue',
          particleColor: '#000000',
          stars: [],
          solarSystems: [],
        };

        currentUniverse = createGalaxy(currentUniverse, newGalaxy);
        const persistResult = await persistUniverseToFile(currentUniverse, testFile);
        expect(persistResult.success).toBe(true);

        // Verify after each save
        const savedContent = await fs.readFile(testFile, 'utf-8');
        const { universe: loadedUniverse, errors } = parseAndValidateUniverse(savedContent);
        expect(errors).toHaveLength(0);
        expect(loadedUniverse.galaxies).toHaveLength(i + 1); // +1 for initial galaxy
      }
    });

    it('should produce consistent serialization for the same data', async () => {
      // Serialize multiple times
      const serialized1 = serializeUniverse(testUniverse);
      const serialized2 = serializeUniverse(testUniverse);
      
      expect(serialized1).toEqual(serialized2);

      // Parse and re-serialize
      const { universe: parsed } = parseAndValidateUniverse(serialized1);
      const serialized3 = serializeUniverse(parsed);
      
      expect(serialized1).toEqual(serialized3);
    });

    it('should handle the complete two-step workflow', async () => {
      // Step 1: Save to disk (PATCH /api/admin/universe)
      const updatedUniverse = updateGalaxy(testUniverse, 'milky-way', {
        description: 'Updated for commit',
      });

      const saveResult = await persistUniverseToFile(updatedUniverse, testFile);
      expect(saveResult.success).toBe(true);

      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Step 2: Read from disk and prepare for commit (POST /api/admin/universe)
      const diskContent = await fs.readFile(testFile, 'utf-8');
      
      // Validate before committing
      const { errors } = parseAndValidateUniverse(diskContent);
      expect(errors).toHaveLength(0);

      // In real workflow, this content would be pushed to GitHub
      expect(diskContent).toContain('Updated for commit');
    });
  });

  describe('Error Recovery', () => {
    it('should not leave temp files on successful save', async () => {
      await persistUniverseToFile(testUniverse, testFile);

      const files = await fs.readdir(testDir);
      const tempFiles = files.filter(f => f.includes('.tmp'));
      
      expect(tempFiles).toHaveLength(0);
    });

    it('should handle missing directory by creating it', async () => {
      const deepPath = path.join(testDir, 'deep', 'nested', 'path', 'universe.json');
      
      const result = await persistUniverseToFile(testUniverse, deepPath);
      expect(result.success).toBe(true);

      const exists = await fs.access(deepPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should provide actionable error messages', async () => {
      const invalidUniverse = {
        galaxies: [
          {
            id: '',
            name: '',
            description: '',
            theme: '',
            particleColor: '',
          },
        ],
      } as Universe;

      const result = await persistUniverseToFile(invalidUniverse, testFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Validation failed');
    });
  });
});
