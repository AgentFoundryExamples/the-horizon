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

import { getGitHubConfig, validateGitHubToken } from '../github';

describe('GitHub', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
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
});
