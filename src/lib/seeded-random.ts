/**
 * Seeded pseudo-random number generator utilities
 * Uses Linear Congruential Generator (LCG) for deterministic randomness
 */

// Linear Congruential Generator (LCG) constants for deterministic pseudo-random numbers
// These values are from Numerical Recipes and provide good distribution for small sequences
// Formula: state = (state * LCG_A + LCG_C) % LCG_M
// See: https://en.wikipedia.org/wiki/Linear_congruential_generator
const LCG_A = 9301;      // Multiplier
const LCG_C = 49297;     // Increment  
const LCG_M = 233280;    // Modulus

/**
 * Creates a seeded pseudo-random number generator for deterministic randomness
 * Uses Linear Congruential Generator with Numerical Recipes parameters
 * 
 * @param seed - Integer seed value for the generator
 * @returns Function that returns deterministic random values between 0 and 1
 * 
 * @example
 * ```typescript
 * const random = createSeededRandom(12345);
 * const value1 = random(); // Always returns the same value for seed 12345
 * const value2 = random(); // Next value in sequence
 * ```
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * LCG_A + LCG_C) % LCG_M;
    return state / LCG_M;
  };
}

/**
 * Generate a deterministic seed from a string ID
 * 
 * @param id - String identifier to convert to numeric seed
 * @param offset - Optional offset to add to the seed for variation
 * @returns Numeric seed value
 * 
 * @example
 * ```typescript
 * const seed = generateSeedFromId('galaxy-123', 0);
 * const random = createSeededRandom(seed);
 * ```
 */
export function generateSeedFromId(id: string, offset: number = 0): number {
  return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + offset;
}
