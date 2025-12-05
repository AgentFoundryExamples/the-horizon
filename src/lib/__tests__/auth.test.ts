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
 * @jest-environment node
 */

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

import { validatePassword, checkRateLimit, recordFailedAttempt, clearLoginAttempts } from '../auth';

describe('Auth', () => {
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

  describe('validatePassword', () => {
    it('should return false when ADMIN_PASSWORD is not set', async () => {
      delete process.env.ADMIN_PASSWORD;
      expect(await validatePassword('any-password')).toBe(false);
    });

    it('should return false when ADMIN_PASSWORD is default value', async () => {
      process.env.ADMIN_PASSWORD = 'CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS';
      expect(await validatePassword('CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS')).toBe(false);
    });

    it('should return true when password matches ADMIN_PASSWORD', async () => {
      process.env.ADMIN_PASSWORD = 'correct-password-123';
      expect(await validatePassword('correct-password-123')).toBe(true);
    });

    it('should return false when password does not match', async () => {
      process.env.ADMIN_PASSWORD = 'correct-password-123';
      expect(await validatePassword('wrong-password')).toBe(false);
    });

    it('should be case-sensitive', async () => {
      process.env.ADMIN_PASSWORD = 'Password123';
      expect(await validatePassword('password123')).toBe(false);
      expect(await validatePassword('Password123')).toBe(true);
    });

    it('should use timing-safe comparison (same length passwords)', async () => {
      process.env.ADMIN_PASSWORD = 'password1';
      // Both passwords are same length but different - should still return false
      expect(await validatePassword('password2')).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear any existing rate limit data
      clearLoginAttempts('test-ip');
    });

    it('should allow login attempts initially', () => {
      const result = checkRateLimit('test-ip');
      expect(result.allowed).toBe(true);
    });

    it('should track failed login attempts', () => {
      recordFailedAttempt('test-ip');
      recordFailedAttempt('test-ip');
      const result = checkRateLimit('test-ip');
      expect(result.allowed).toBe(true); // Still allowed, under limit
    });

    it('should block after max attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('test-ip');
      }
      const result = checkRateLimit('test-ip');
      expect(result.allowed).toBe(false);
      expect(result.resetAt).toBeDefined();
    });

    it('should clear attempts on successful login', () => {
      recordFailedAttempt('test-ip');
      recordFailedAttempt('test-ip');
      clearLoginAttempts('test-ip');
      const result = checkRateLimit('test-ip');
      expect(result.allowed).toBe(true);
    });

    it('should handle different IPs independently', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('ip-1');
      }
      const result1 = checkRateLimit('ip-1');
      const result2 = checkRateLimit('ip-2');
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });
});
