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

import { getGitHubConfig, validateGitHubToken, pushUniverseChanges, fetchCurrentUniverse } from '../github';

// Mock fetch globally
global.fetch = jest.fn();

// Mock sha256 function
jest.mock('../crypto', () => ({
  sha256: jest.fn((content: string) => {
    // Simple mock hash based on content
    return Promise.resolve(`hash-${content.length}-${content.substring(0, 10)}`);
  }),
}));

describe('GitHub', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('getGitHubConfig', () => {
    it('should return null when required env vars are missing', () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;
      
      expect(getGitHubConfig()).toBeNull();
    });

    it('should return config when all required env vars are set', () => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      process.env.GITHUB_OWNER = 'testowner';
      process.env.GITHUB_REPO = 'testrepo';
      process.env.GITHUB_BRANCH = 'main';

      const config = getGitHubConfig();
      expect(config).toEqual({
        token: 'ghp_test123',
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main',
      });
    });

    it('should use default branch when not specified', () => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      process.env.GITHUB_OWNER = 'testowner';
      process.env.GITHUB_REPO = 'testrepo';
      delete process.env.GITHUB_BRANCH;

      const config = getGitHubConfig();
      expect(config?.branch).toBe('main');
    });

    it('should use Vercel env vars as fallback', () => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      process.env.VERCEL_GIT_REPO_OWNER = 'vercelowner';
      process.env.VERCEL_GIT_REPO_SLUG = 'vercelrepo';
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;

      const config = getGitHubConfig();
      expect(config).toEqual({
        token: 'ghp_test123',
        owner: 'vercelowner',
        repo: 'vercelrepo',
        branch: 'main',
      });
    });
  });

  describe('validateGitHubToken', () => {
    it('should return true for ghp_ tokens', () => {
      expect(validateGitHubToken('ghp_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true);
    });

    it('should return true for github_pat_ tokens', () => {
      expect(validateGitHubToken('github_pat_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true);
    });

    it('should return false for invalid token format', () => {
      expect(validateGitHubToken('invalid_token')).toBe(false);
      expect(validateGitHubToken('abc123')).toBe(false);
      expect(validateGitHubToken('')).toBe(false);
    });
  });

  describe('pushUniverseChanges', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      process.env.GITHUB_OWNER = 'testowner';
      process.env.GITHUB_REPO = 'testrepo';
      process.env.GITHUB_BRANCH = 'main';
    });

    it('should return error when GitHub config is incomplete', async () => {
      delete process.env.GITHUB_TOKEN;

      const result = await pushUniverseChanges(
        '{"galaxies":[]}',
        'Test commit'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('configuration is incomplete');
    });

    it('should return error when token format is invalid', async () => {
      process.env.GITHUB_TOKEN = 'invalid_token';

      const result = await pushUniverseChanges(
        '{"galaxies":[]}',
        'Test commit'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid GitHub token format');
    });

    it('should return error when file not found in repository', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await pushUniverseChanges(
        '{"galaxies":[]}',
        'Test commit'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should verify gitBaseHash matches GitHub HEAD before committing', async () => {
      const githubContent = '{"galaxies":["original"]}';
      const newContent = '{"galaxies":["MODIFIED_CONTENT_HERE"]}'; // Different length and prefix
      
      // Mock getFileSha (initial check) - returns original content
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'github-sha-abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock getFileSha (final check before commit) - still returns original
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'github-sha-abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock commitFile - returns new commit SHA
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'new-commit-sha-def456' },
          }),
        });

      // Calculate the expected hash based on githubContent using the mocked sha256
      // The mock returns `hash-${content.length}-${content.substring(0, 10)}`
      const expectedHash = `hash-${githubContent.length}-${githubContent.substring(0, 10)}`;
      
      const result = await pushUniverseChanges(
        newContent,
        'Test commit',
        false,
        expectedHash // gitBaseHash must match GitHub HEAD
      );

      // Should succeed - gitBaseHash matches GitHub HEAD and content differs
      expect(result.success).toBe(true);
      expect(result.message).toContain('committed successfully');
      expect(result.sha).toBe('new-commit-sha-def456');
    });

    it('should successfully commit directly to main branch', async () => {
      const githubContent = '{"galaxies":["original"]}';
      const newContent = '{"galaxies":["DIFFERENT_NEW_CONTENT"]}'; // Different to ensure hashes don't match
      
      // Mock getFileSha (initial check)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock getFileSha (final check before commit)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock commitFile
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'def456' },
          }),
        });

      const result = await pushUniverseChanges(
        newContent,
        'Test commit',
        false
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('committed successfully');
      expect(result.sha).toBe('def456');
    });

    it('should successfully create pull request', async () => {
      const githubContent = '{"galaxies":["original"]}';
      const newContent = '{"galaxies":["COMPLETELY_DIFFERENT_PR_CONTENT"]}'; // Different to ensure hashes don't match
      
      // Mock getFileSha (initial)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock getBaseBranch for createBranch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: { sha: 'base123' },
          }),
        })
        // Mock createBranch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        // Mock getFileSha (after branch creation)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Mock commitFile
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'commit123' },
          }),
        })
        // Mock createPullRequest
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            html_url: 'https://github.com/test/repo/pull/1',
          }),
        });

      const result = await pushUniverseChanges(
        newContent,
        'Test commit',
        true
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pull request created');
      expect(result.prUrl).toBe('https://github.com/test/repo/pull/1');
    });

    it('should prevent empty commits when content matches GitHub HEAD', async () => {
      const content = '{"galaxies":["test"]}';
      
      // Mock getFileSha returning same content
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          content: Buffer.from(content).toString('base64'),
        }),
      });

      const result = await pushUniverseChanges(
        content,
        'Test commit',
        false
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('No changes to commit');
      expect(result.hash).toBeDefined(); // Returns content hash (no commit happened)
    });

    it('should handle rate limit errors', async () => {
      const content = '{"galaxies":["test"]}';
      const githubContent = 'different content';
      // Mock sha256 returns hash-${length}-${prefix}
      const githubHash = `hash-${githubContent.length}-${githubContent.substring(0, 10)}`;
      
      // First fetch for getFileSha succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        // Second fetch for final commit fails with rate limit
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockRejectedValueOnce(
          new Error('rate limit exceeded')
        );

      const result = await pushUniverseChanges(
        content,
        'Test commit',
        false,
        githubHash // Use matching hash to pass optimistic lock check
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('rate limit');
    });

    it('should handle authentication errors', async () => {
      const content = '{"galaxies":["test"]}';
      const githubContent = 'different content';
      const githubHash = `hash-${githubContent.length}-${githubContent.substring(0, 10)}`;
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockRejectedValueOnce(
          new Error('401 Bad credentials')
        );

      const result = await pushUniverseChanges(
        content,
        'Test commit',
        false,
        githubHash // Use matching hash to pass optimistic lock check
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication failed');
    });

    it('should handle permission errors', async () => {
      const content = '{"galaxies":["test"]}';
      const githubContent = 'different content';
      const githubHash = `hash-${githubContent.length}-${githubContent.substring(0, 10)}`;
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockRejectedValueOnce(
          new Error('403 Forbidden')
        );

      const result = await pushUniverseChanges(
        content,
        'Test commit',
        false,
        githubHash // Use matching hash to pass optimistic lock check
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Permission denied');
    });

    it('should detect SHA mismatch errors and provide retry guidance', async () => {
      const content = '{"galaxies":["test"]}';
      const githubContent = 'different content';
      const githubHash = `hash-${githubContent.length}-${githubContent.substring(0, 10)}`;
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'abc123',
            content: Buffer.from(githubContent).toString('base64'),
          }),
        })
        .mockRejectedValueOnce(
          new Error('does not match the expected SHA')
        );

      const result = await pushUniverseChanges(
        content,
        'Test commit',
        false,
        githubHash // Use matching hash to pass optimistic lock check
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Conflict detected');
      expect(result.error).toContain('refresh, re-apply your changes');
    });
  });

  describe('fetchCurrentUniverse', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      process.env.GITHUB_OWNER = 'testowner';
      process.env.GITHUB_REPO = 'testrepo';
      process.env.GITHUB_BRANCH = 'main';
    });

    it('should return null when GitHub config is incomplete', async () => {
      delete process.env.GITHUB_TOKEN;

      const result = await fetchCurrentUniverse();
      expect(result).toBeNull();
    });

    it('should fetch and return universe content with hash', async () => {
      const content = '{"galaxies":["test"]}';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          content: Buffer.from(content).toString('base64'),
        }),
      });

      const result = await fetchCurrentUniverse();
      
      expect(result).not.toBeNull();
      expect(result?.content).toBe(content);
      expect(result?.hash).toBeDefined();
    });

    it('should return null when file not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchCurrentUniverse();
      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchCurrentUniverse();
      expect(result).toBeNull();
    });
  });
});
