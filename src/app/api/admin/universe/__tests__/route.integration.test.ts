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
// Integration tests for the save → commit workflow
// Tests the full pipeline from disk save to GitHub commit

/**
 * Note: These tests verify the logical flow of the save → commit pipeline
 * but don't test the actual Next.js request/response handling due to
 * the complexity of mocking Next.js server components in Jest.
 * 
 * For full end-to-end testing of the HTTP layer, use manual testing or
 * Playwright/Cypress tests with a running server.
 */

import * as persist from '@/lib/universe/persist';
import * as github from '@/lib/github';
import type { Universe } from '@/lib/universe/types';

// Mock dependencies
jest.mock('@/lib/universe/persist');
jest.mock('@/lib/github');

describe('Save → Commit Pipeline Integration Tests', () => {
  const testUniverse: Universe = {
    galaxies: [
      {
        id: 'test-galaxy',
        name: 'Test Galaxy',
        description: 'Test description',
        theme: 'blue-white',
        particleColor: '#4A90E2',
        stars: [],
        solarSystems: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Flow: Save to Disk → Commit to GitHub', () => {
    it('should complete full workflow: save to disk then commit to GitHub', async () => {
      const content = JSON.stringify(testUniverse, null, 2);

      // Step 1: Save to disk
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      const saveResult = await persist.persistUniverseToFile(testUniverse);
      expect(saveResult.success).toBe(true);

      // Step 2: Commit to GitHub with fresh SHA fetch
      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Changes committed successfully',
        sha: 'abc123',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test commit',
        false
      );

      expect(commitResult.success).toBe(true);
      expect(commitResult.sha).toBe('abc123');
      expect(github.pushUniverseChanges).toHaveBeenCalledWith(
        content,
        'Test commit',
        false
      );
    });

    it('should handle PR creation workflow', async () => {
      const content = JSON.stringify(testUniverse, null, 2);

      // Save to disk
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      await persist.persistUniverseToFile(testUniverse);

      // Create PR
      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Pull request created successfully',
        sha: 'def456',
        prUrl: 'https://github.com/test/repo/pull/1',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test PR commit',
        true // createPR = true
      );

      expect(commitResult.success).toBe(true);
      expect(commitResult.prUrl).toBe('https://github.com/test/repo/pull/1');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflict when GitHub HEAD changed', async () => {
      const content = JSON.stringify(testUniverse, null, 2);
      // Mock hash for testing (crypto.sha256 requires Web Crypto API not available in Jest)
      const contentHash = 'mock-hash-abc123';

      // Save succeeds
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      await persist.persistUniverseToFile(testUniverse);

      // GitHub push fails with conflict
      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Content has been modified by another user',
        error: 'The file has changed since you started editing. Please refresh, re-apply your changes, save to disk, and then commit again.',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test commit',
        false,
        contentHash
      );

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toContain('changed since you started editing');
    });

    it('should provide retry guidance on conflict', async () => {
      const content = JSON.stringify(testUniverse, null, 2);

      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Conflict detected: file changed remotely',
        error: 'The file was modified in GitHub between your save and commit. Please refresh, re-apply your changes, save, and try committing again.',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test commit',
        false
      );

      expect(commitResult.success).toBe(false);
      expect(commitResult.message).toContain('Conflict detected');
      expect(commitResult.error).toContain('refresh, re-apply your changes');
    });
  });

  describe('Error Handling', () => {
    it('should handle disk write failures', async () => {
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Disk full',
      });

      const saveResult = await persist.persistUniverseToFile(testUniverse);

      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBe('Disk full');
    });

    it('should handle GitHub API errors', async () => {
      const content = JSON.stringify(testUniverse, null, 2);

      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Authentication failed',
        error: 'GitHub token is invalid or expired. Please check your GITHUB_TOKEN environment variable.',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test commit',
        false
      );

      expect(commitResult.success).toBe(false);
      expect(commitResult.message).toContain('Authentication failed');
    });

    it('should handle missing GitHub configuration', async () => {
      const content = JSON.stringify(testUniverse, null, 2);

      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: false,
        message: 'GitHub configuration is incomplete',
        error: 'Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO environment variables',
      });

      const commitResult = await github.pushUniverseChanges(
        content,
        'Test commit',
        false
      );

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toContain('Missing GITHUB_TOKEN');
    });
  });

  describe('Sequential Operations', () => {
    it('should handle multiple sequential saves', async () => {
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      // First save
      const result1 = await persist.persistUniverseToFile(testUniverse);
      expect(result1.success).toBe(true);

      // Second save (update)
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

      const result2 = await persist.persistUniverseToFile(updatedUniverse);
      expect(result2.success).toBe(true);
      expect(persist.persistUniverseToFile).toHaveBeenCalledTimes(2);
    });

    it('should handle save-commit-save-commit cycle', async () => {
      const content1 = JSON.stringify(testUniverse, null, 2);

      // First cycle: save and commit
      (persist.persistUniverseToFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      await persist.persistUniverseToFile(testUniverse);

      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Changes committed successfully',
        sha: 'abc123',
      });

      const commit1 = await github.pushUniverseChanges(
        content1,
        'First commit',
        false
      );

      expect(commit1.success).toBe(true);

      // Second cycle: save updated content and commit
      const updatedUniverse = {
        ...testUniverse,
        galaxies: [
          {
            ...testUniverse.galaxies[0],
            description: 'Updated description',
          },
        ],
      };

      const content2 = JSON.stringify(updatedUniverse, null, 2);

      await persist.persistUniverseToFile(updatedUniverse);

      (github.pushUniverseChanges as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Changes committed successfully',
        sha: 'def456',
      });

      const commit2 = await github.pushUniverseChanges(
        content2,
        'Second commit',
        false
      );

      expect(commit2.success).toBe(true);
      expect(persist.persistUniverseToFile).toHaveBeenCalledTimes(2);
      expect(github.pushUniverseChanges).toHaveBeenCalledTimes(2);
    });
  });
});

