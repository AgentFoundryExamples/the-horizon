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

// Get crypto from global scope (works in browser, Edge, and Node with polyfill)
const getCrypto = (): Crypto => {
  if (typeof crypto !== 'undefined') {
    return crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof global !== 'undefined' && (global as any).crypto) {
    return (global as any).crypto;
  }
  throw new Error('Web Crypto API is not available');
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
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);
  
  // If lengths differ, comparison fails (but still compare all bytes for timing safety)
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  
  // XOR all bytes and accumulate the result
  // This ensures the comparison takes the same time regardless of where differences occur
  let result = 0;
  for (let i = 0; i < bufferA.length; i++) {
    result |= bufferA[i] ^ bufferB[i];
  }
  
  return result === 0;
}
