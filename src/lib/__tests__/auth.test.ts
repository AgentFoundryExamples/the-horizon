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

import { validatePassword } from '../auth';

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
    it('should return false when ADMIN_PASSWORD is not set', () => {
      delete process.env.ADMIN_PASSWORD;
      expect(validatePassword('any-password')).toBe(false);
    });

    it('should return false when ADMIN_PASSWORD is default value', () => {
      process.env.ADMIN_PASSWORD = 'CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS';
      expect(validatePassword('CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS')).toBe(false);
    });

    it('should return true when password matches ADMIN_PASSWORD', () => {
      process.env.ADMIN_PASSWORD = 'correct-password-123';
      expect(validatePassword('correct-password-123')).toBe(true);
    });

    it('should return false when password does not match', () => {
      process.env.ADMIN_PASSWORD = 'correct-password-123';
      expect(validatePassword('wrong-password')).toBe(false);
    });

    it('should be case-sensitive', () => {
      process.env.ADMIN_PASSWORD = 'Password123';
      expect(validatePassword('password123')).toBe(false);
      expect(validatePassword('Password123')).toBe(true);
    });
  });
});
