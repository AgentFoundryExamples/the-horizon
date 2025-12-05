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

import { randomBytes, sha256, timingSafeEqual } from '../crypto';

describe('Crypto Utilities', () => {
  describe('randomBytes', () => {
    it('should generate random bytes of specified length', () => {
      const bytes = randomBytes(16);
      expect(bytes).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(bytes).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values on each call', () => {
      const bytes1 = randomBytes(16);
      const bytes2 = randomBytes(16);
      expect(bytes1).not.toBe(bytes2);
    });

    it('should handle different lengths', () => {
      expect(randomBytes(8)).toHaveLength(16); // 8 bytes = 16 hex chars
      expect(randomBytes(32)).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe('sha256', () => {
    it('should generate consistent hash for same input', async () => {
      const hash1 = await sha256('test-input');
      const hash2 = await sha256('test-input');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await sha256('input1');
      const hash2 = await sha256('input2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex string (256 bits)', async () => {
      const hash = await sha256('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle empty string', async () => {
      const hash = await sha256('');
      expect(hash).toHaveLength(64);
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should be case-sensitive', async () => {
      const hash1 = await sha256('Test');
      const hash2 = await sha256('test');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for identical strings', () => {
      expect(timingSafeEqual('hello', 'hello')).toBe(true);
      expect(timingSafeEqual('test123', 'test123')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(timingSafeEqual('hello', 'world')).toBe(false);
      expect(timingSafeEqual('test1', 'test2')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(timingSafeEqual('short', 'longer-string')).toBe(false);
      expect(timingSafeEqual('abc', 'ab')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(timingSafeEqual('Test', 'test')).toBe(false);
      expect(timingSafeEqual('ABC', 'abc')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(timingSafeEqual('', '')).toBe(true);
      expect(timingSafeEqual('', 'a')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(timingSafeEqual('test@123!', 'test@123!')).toBe(true);
      expect(timingSafeEqual('test@123!', 'test@456!')).toBe(false);
    });
  });
});
