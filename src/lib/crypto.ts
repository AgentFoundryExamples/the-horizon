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

// Cache the crypto instance to avoid repeated lookups
let cachedCrypto: Crypto | undefined;

// Get crypto from global scope (works in browser, Edge, and Node with polyfill)
const getCrypto = (): Crypto => {
  if (cachedCrypto) {
    return cachedCrypto;
  }
  
  let cryptoInstance: Crypto;
  
  if (typeof crypto !== 'undefined') {
    cryptoInstance = crypto;
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    cryptoInstance = globalThis.crypto;
  } else if (typeof global !== 'undefined' && (global as any).crypto) {
    cryptoInstance = (global as any).crypto;
  } else {
    throw new Error('Web Crypto API is not available');
  }
  
  cachedCrypto = cryptoInstance;
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
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);
  
  // To maintain constant time, we need to compare all bytes
  // even if lengths differ. We'll pad the shorter one with zeros.
  const maxLength = Math.max(bufferA.length, bufferB.length);
  
  // XOR all bytes and accumulate the result
  // This ensures the comparison takes the same time regardless of where differences occur
  let result = 0;
  
  // Add length difference to result (will be non-zero if lengths differ)
  result |= bufferA.length ^ bufferB.length;
  
  for (let i = 0; i < maxLength; i++) {
    // Use 0 for out-of-bounds access to maintain constant time
    const byteA = i < bufferA.length ? bufferA[i] : 0;
    const byteB = i < bufferB.length ? bufferB[i] : 0;
    result |= byteA ^ byteB;
  }
  
  return result === 0;
}
