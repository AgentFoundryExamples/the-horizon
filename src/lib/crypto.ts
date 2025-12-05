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
 * Edge-compatible crypto utilities using Web Crypto API
 * These functions work in both Edge Runtime and Node.js environments
 */

// Fixed length for constant-time string comparison
// SHA-256 produces 64 hex characters, which when UTF-8 encoded by TextEncoder
// results in 64 bytes (1 byte per character). This ensures all comparisons
// take the same amount of time regardless of actual string length.
const TIMING_SAFE_FIXED_LENGTH = 64;

// Get crypto from global scope (works in browser, Edge, and Node with polyfill)
const getCrypto = (): Crypto => {
  const cryptoInstance = globalThis.crypto;
  
  if (!cryptoInstance) {
    throw new Error('Web Crypto API is not available in this environment.');
  }
  
  return cryptoInstance;
};

/**
 * Generates random bytes as a hex string
 * @param length - Number of bytes to generate
 * @returns Hex string of random bytes
 */
export function randomBytes(length: number): string {
  const cryptoApi = getCrypto();
  const array = new Uint8Array(length);
  cryptoApi.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates SHA-256 hash of the input string
 * @param data - String to hash
 * @returns Promise resolving to hex string of hash
 */
export async function sha256(data: string): Promise<string> {
  const cryptoApi = getCrypto();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await cryptoApi.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Performs timing-safe comparison of two strings
 * Constant-time string comparison to prevent timing attacks
 * Optimized for comparing equal-length hash strings (e.g., SHA-256 hex outputs)
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);
  
  // XOR all bytes and accumulate the result
  let result = 0;
  
  // Compare length difference (will be non-zero if lengths differ)
  result |= bufferA.length ^ bufferB.length;
  
  // Always iterate the full fixed length to maintain constant time
  // This covers SHA-256 hex strings (64 chars = 64 bytes UTF-8) and provides safety margin
  for (let i = 0; i < TIMING_SAFE_FIXED_LENGTH; i++) {
    // Use 0 for out-of-bounds access
    const byteA = i < bufferA.length ? bufferA[i] : 0;
    const byteB = i < bufferB.length ? bufferB[i] : 0;
    result |= byteA ^ byteB;
  }
  
  return result === 0;
}
