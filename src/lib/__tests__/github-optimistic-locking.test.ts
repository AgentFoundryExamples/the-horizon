/**
 * Tests for GitHub optimistic locking with gitBaseHash
 * Ensures commit workflow properly validates gitBaseHash against GitHub HEAD
 */

import { pushUniverseChanges } from '../github';
import crypto from 'crypto';

// Mock sha256 for testing since Web Crypto API is not available in Jest
jest.mock('@/lib/crypto', () => ({
  sha256: jest.fn((data: string) => {
    return Promise.resolve(crypto.createHash('sha256').update(data).digest('hex'));
  }),
}));

// Mock fetch for GitHub API calls
global.fetch = jest.fn();

describe('GitHub Optimistic Locking with gitBaseHash', () => {
  const originalContent = JSON.stringify({ galaxies: [{ id: 'test', name: 'Test Galaxy' }] }, null, 2);
  const modifiedContent = JSON.stringify({ galaxies: [{ id: 'test', name: 'Modified Galaxy' }] }, null, 2);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for GitHub config
    process.env.GITHUB_TOKEN = 'ghp_mock_token_1234567890';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
    process.env.GITHUB_BRANCH = 'main';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
    delete process.env.GITHUB_BRANCH;
  });

  describe('Happy Path - No Conflicts', () => {
    it('should successfully commit when gitBaseHash matches GitHub HEAD', async () => {
      const gitBaseHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      // Mock GitHub API responses
      // 1. Initial fetch to get current file
      // 2. Final fetch right before commit
      // 3. Commit operation
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'mock-commit-sha-456' },
          }),
        });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        gitBaseHash
      );

      expect(result.success).toBe(true);
      expect(result.hash).toBeDefined();
      expect(result.sha).toBe('mock-commit-sha-456');
      expect(result.message).toContain('committed successfully');
    });

    it('should return new content hash after successful commit', async () => {
      const gitBaseHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'mock-commit-sha-456' },
          }),
        });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        gitBaseHash
      );

      expect(result.success).toBe(true);
      expect(result.hash).toBe(crypto.createHash('sha256').update(modifiedContent).digest('hex'));
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflict when gitBaseHash does not match GitHub HEAD', async () => {
      const oldHash = crypto.createHash('sha256').update(originalContent).digest('hex');
      const someoneElsesContent = JSON.stringify({ galaxies: [{ id: 'test', name: "Someone Else's Galaxy" }] }, null, 2);

      // Mock GitHub returning different content than gitBaseHash expects
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'mock-file-sha-999',
          content: Buffer.from(someoneElsesContent).toString('base64'),
        }),
      });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        oldHash
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Conflict detected');
      expect(result.error).toContain('modified in GitHub');
    });

    it('should provide actionable error message on conflict', async () => {
      const oldHash = crypto.createHash('sha256').update(originalContent).digest('hex');
      const someoneElsesContent = JSON.stringify({ galaxies: [{ id: 'test', name: 'Different' }] }, null, 2);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'mock-file-sha-999',
          content: Buffer.from(someoneElsesContent).toString('base64'),
        }),
      });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        oldHash
      );

      expect(result.error).toContain('refresh');
      expect(result.error).toContain('re-apply your changes');
      expect(result.error).toContain('save');
      expect(result.error).toContain('try committing again');
    });
  });

  describe('No gitBaseHash Provided', () => {
    it('should skip optimistic locking when gitBaseHash is not provided', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'mock-commit-sha-456' },
          }),
        });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        undefined // No gitBaseHash
      );

      expect(result.success).toBe(true);
    });
  });

  describe('No Changes to Commit', () => {
    it('should return success when content matches GitHub HEAD', async () => {
      const currentHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'mock-file-sha-123',
          content: Buffer.from(originalContent).toString('base64'),
        }),
      });

      const result = await pushUniverseChanges(
        originalContent, // Same content as GitHub
        'No changes',
        false,
        currentHash
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('No changes to commit');
      expect(result.hash).toBe(currentHash);
    });
  });

  describe('Pull Request Workflow', () => {
    it('should create PR with optimistic locking', async () => {
      const gitBaseHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: { sha: 'base-branch-sha' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'mock-commit-sha-456' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            html_url: 'https://github.com/test/pr/1',
          }),
        });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        true, // Create PR
        gitBaseHash
      );

      expect(result.success).toBe(true);
      expect(result.prUrl).toBe('https://github.com/test/pr/1');
      expect(result.hash).toBeDefined();
    });

    it('should detect conflict during PR creation', async () => {
      const oldHash = crypto.createHash('sha256').update(originalContent).digest('hex');
      const someoneElsesContent = JSON.stringify({ galaxies: [{ id: 'test', name: 'Different' }] }, null, 2);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'mock-file-sha-999',
          content: Buffer.from(someoneElsesContent).toString('base64'),
        }),
      });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        true, // Create PR
        oldHash
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Conflict detected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing hash in response gracefully', async () => {
      const gitBaseHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sha: 'mock-file-sha-123',
            content: Buffer.from(originalContent).toString('base64'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            commit: { sha: 'mock-commit-sha-456' },
          }),
        });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        gitBaseHash
      );

      // Should still succeed and compute hash from content
      expect(result.success).toBe(true);
      expect(result.hash).toBeDefined();
    });

    it('should handle GitHub API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      const result = await pushUniverseChanges(
        modifiedContent,
        'Update galaxy',
        false,
        'some-hash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
