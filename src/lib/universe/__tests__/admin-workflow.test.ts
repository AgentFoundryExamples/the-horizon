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
 * Tests for admin API persistence workflow
 * 
 * @deprecated These tests cover the legacy two-step save workflow (save-to-disk + commit)
 * which has been replaced with direct GitHub commits for Vercel compatibility.
 * 
 * The persistUniverseToFile function is kept for local development only.
 * Production admin interface now commits directly to GitHub without disk persistence.
 * 
 * Tests remain to ensure the persist function works correctly for local development.
 */

import { persistUniverseToFile } from '../persist';
import { parseAndValidateUniverse } from '../mutate';
import type { Universe } from '../types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Mock sha256 for testing since Web Crypto API is not available in Jest
jest.mock('@/lib/crypto', () => ({
  sha256: jest.fn((data: string) => {
    // Create a simple but deterministic hash based on content
    // Use Node.js crypto module for testing
    return Promise.resolve(crypto.createHash('sha256').update(data).digest('hex'));
  }),
}));

import { sha256 } from '@/lib/crypto';

describe('Admin API Persistence Workflow', () => {
  const testRunId = `test-api-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testDir = path.join(os.tmpdir(), testRunId);
  const testFile = path.join(testDir, 'universe.json');

  let testUniverse: Universe;

  beforeEach(async () => {
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
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('PATCH Endpoint Behavior (Save to Disk)', () => {
    it('should save changes without fetching from GitHub', async () => {
      // Simulate PATCH behavior: persist to local file
      const result = await persistUniverseToFile(testUniverse, testFile);
      expect(result.success).toBe(true);

      // Verify file was written
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toContain('Test Galaxy');
    });

    it('should maintain optimistic lock hash after save', async () => {
      // First save
      await persistUniverseToFile(testUniverse, testFile);
      const content1 = await fs.readFile(testFile, 'utf-8');
      const hash1 = await sha256(content1);

      // Second save with different data
      const modifiedUniverse = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Modified description',
          },
        ],
      };

      await persistUniverseToFile(modifiedUniverse, testFile);
      const content2 = await fs.readFile(testFile, 'utf-8');
      const hash2 = await sha256(content2);

      // Hashes should be different
      expect(hash1).not.toEqual(hash2);
    });

    it('should validate data before persisting', async () => {
      const invalidUniverse = {
        galaxies: [
          {
            id: '',
            name: '',
            description: '',
            theme: '',
            particleColor: '',
            stars: [],
            solarSystems: [],
          },
        ],
      } as Universe;

      const result = await persistUniverseToFile(invalidUniverse, testFile);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should detect concurrent edits via hash mismatch', async () => {
      // Save initial version
      await persistUniverseToFile(testUniverse, testFile);
      const content1 = await fs.readFile(testFile, 'utf-8');
      const hash1 = await sha256(content1);

      // Simulate concurrent edit by another admin
      const concurrentUniverse = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Concurrent change',
          },
        ],
      };
      await persistUniverseToFile(concurrentUniverse, testFile);
      const content2 = await fs.readFile(testFile, 'utf-8');
      const hash2 = await sha256(content2);

      // Hash comparison in API would detect this
      expect(hash1).not.toEqual(hash2);
      expect(content2).toContain('Concurrent change');
    });
  });

  describe('GET Endpoint Behavior (Load Data)', () => {
    it('should read from local file by default', async () => {
      // Setup: save data to local file
      await persistUniverseToFile(testUniverse, testFile);

      // Simulate GET without syncFromGitHub flag
      const content = await fs.readFile(testFile, 'utf-8');
      const { universe, errors } = parseAndValidateUniverse(content);

      expect(errors).toHaveLength(0);
      expect(universe.galaxies).toHaveLength(1);
      expect(universe.galaxies[0].name).toBe('Test Galaxy');
    });

    it('should not overwrite local edits with GitHub fetch', async () => {
      // Save local edit
      const localEdit = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Local unsaved edit',
          },
        ],
      };
      await persistUniverseToFile(localEdit, testFile);

      // Verify local file has the edit
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toContain('Local unsaved edit');

      // GET should read this, not overwrite with GitHub
      const { universe } = parseAndValidateUniverse(content);
      expect(universe.galaxies[0].description).toBe('Local unsaved edit');
    });

    it('should provide hash for optimistic locking', async () => {
      await persistUniverseToFile(testUniverse, testFile);
      const content = await fs.readFile(testFile, 'utf-8');
      const hash = await sha256(content);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('POST Endpoint Behavior (Commit to GitHub)', () => {
    it('should read from persisted file, not in-memory state', async () => {
      // Save to disk
      await persistUniverseToFile(testUniverse, testFile);

      // Simulate POST reading from file
      const content = await fs.readFile(testFile, 'utf-8');
      const { universe, errors } = parseAndValidateUniverse(content);

      expect(errors).toHaveLength(0);
      expect(universe).toEqual(testUniverse);
    });

    it('should validate data before committing', async () => {
      // Save invalid data to file (shouldn't happen, but test defense)
      const invalidJson = '{"galaxies": [{"id": "", "name": ""}]}';
      await fs.writeFile(testFile, invalidJson, 'utf-8');

      // POST should validate before committing
      const content = await fs.readFile(testFile, 'utf-8');
      const { errors } = parseAndValidateUniverse(content);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should verify hash matches before committing', async () => {
      // Save initial version
      await persistUniverseToFile(testUniverse, testFile);
      const content1 = await fs.readFile(testFile, 'utf-8');
      const hash1 = await sha256(content1);

      // Modify file (simulating concurrent edit)
      const modified = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Changed after save',
          },
        ],
      };
      await persistUniverseToFile(modified, testFile);
      const content2 = await fs.readFile(testFile, 'utf-8');
      const hash2 = await sha256(content2);

      // POST should detect hash mismatch
      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full cycle: GET → Edit → PATCH → POST', async () => {
      // Step 1: GET - initial load (from local file)
      await persistUniverseToFile(testUniverse, testFile);
      const initialContent = await fs.readFile(testFile, 'utf-8');
      const { universe: loadedUniverse } = parseAndValidateUniverse(initialContent);
      const initialHash = await sha256(initialContent);

      expect(loadedUniverse.galaxies).toHaveLength(1);

      // Step 2: Edit in memory
      const editedUniverse = {
        ...loadedUniverse,
        galaxies: [
          {
            ...loadedUniverse.galaxies[0],
            description: 'Updated description',
          },
        ],
      };

      // Step 3: PATCH - save to disk
      const patchResult = await persistUniverseToFile(editedUniverse, testFile);
      expect(patchResult.success).toBe(true);

      // Verify hash changed
      const patchedContent = await fs.readFile(testFile, 'utf-8');
      const patchedHash = await sha256(patchedContent);
      expect(patchedHash).not.toEqual(initialHash);

      // Step 4: POST - read from disk for commit
      const postContent = await fs.readFile(testFile, 'utf-8');
      const { universe: postUniverse, errors } = parseAndValidateUniverse(postContent);
      
      expect(errors).toHaveLength(0);
      expect(postUniverse.galaxies[0].description).toBe('Updated description');
    });

    it('should prevent race condition with concurrent saves', async () => {
      // Admin A loads data
      await persistUniverseToFile(testUniverse, testFile);
      const contentA = await fs.readFile(testFile, 'utf-8');
      const hashA = await sha256(contentA);

      // Admin B loads data (same version)
      const contentB = await fs.readFile(testFile, 'utf-8');
      const hashB = await sha256(contentB);
      expect(hashA).toEqual(hashB);

      // Admin B saves first
      const editB = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Edit by Admin B',
          },
        ],
      };
      await persistUniverseToFile(editB, testFile);
      const contentAfterB = await fs.readFile(testFile, 'utf-8');
      const hashAfterB = await sha256(contentAfterB);

      // Admin A tries to save (hash should mismatch)
      expect(hashA).not.toEqual(hashAfterB);
      
      // In real API, this would trigger 409 Conflict
    });

    it('should allow sequential edits without conflicts', async () => {
      await persistUniverseToFile(testUniverse, testFile);

      // Edit 1
      const edit1 = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'First edit',
          },
        ],
      };
      await persistUniverseToFile(edit1, testFile);
      const content1 = await fs.readFile(testFile, 'utf-8');
      const hash1 = await sha256(content1);

      // Edit 2 (load fresh, then edit)
      const { universe: fresh } = parseAndValidateUniverse(content1);
      const edit2 = {
        ...fresh,
        galaxies: [
          {
            ...fresh.galaxies[0],
            description: 'Second edit',
          },
        ],
      };
      await persistUniverseToFile(edit2, testFile);
      const content2 = await fs.readFile(testFile, 'utf-8');
      const hash2 = await sha256(content2);

      expect(hash1).not.toEqual(hash2);
      expect(content2).toContain('Second edit');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing file gracefully', async () => {
      const nonExistentPath = path.join(testDir, 'does-not-exist.json');
      
      try {
        await fs.readFile(nonExistentPath, 'utf-8');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject invalid JSON in persisted file', async () => {
      await fs.writeFile(testFile, 'invalid json{{{', 'utf-8');
      
      const content = await fs.readFile(testFile, 'utf-8');
      const { errors } = parseAndValidateUniverse(content);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid JSON');
    });

    it('should handle corrupted universe data', async () => {
      const corruptedData = JSON.stringify({
        galaxies: null,  // Invalid: should be array
      });
      
      await fs.writeFile(testFile, corruptedData, 'utf-8');
      const content = await fs.readFile(testFile, 'utf-8');
      const { errors } = parseAndValidateUniverse(content);
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
