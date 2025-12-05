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
 * Scale constants for solar system rendering
 * 
 * These constants ensure planets are easily clickable and properly spaced,
 * meeting WCAG 2.1 touch target guidelines (minimum 44x44 CSS pixels).
 * 
 * All sizes are in Three.js units (approximately 1 unit = 50-60 CSS pixels at default zoom).
 * Note: This conversion factor assumes default Three.js camera settings and viewport size.
 * Changes to camera FOV, position, or viewport dimensions may affect the actual CSS pixel size.
 */

/**
 * Planet size configuration
 * Base sizes scaled for visibility and interaction
 */
export const PLANET_SCALE = {
  /**
   * Minimum planet radius in Three.js units
   * Ensures ~44-50px minimum tap target at default zoom
   */
  MIN_SIZE: 0.8,
  
  /**
   * Maximum planet radius in Three.js units
   * Prevents planets from dominating the view
   */
  MAX_SIZE: 1.8,
  
  /**
   * Base size used for planet calculations
   * Currently not used in calculatePlanetSize() which starts from MIN_SIZE
   * Kept for potential future use or custom implementations
   */
  BASE_SIZE: 1.0,
  
  /**
   * Size increment per moon
   * Adds visual variety while maintaining reasonable sizes
   */
  MOON_MULTIPLIER: 0.1,
  
  /**
   * Moon size multiplier relative to minimum planet size
   * Maintains visual hierarchy where moons are smaller than planets
   */
  MOON_SIZE_RATIO: 0.4,
} as const;

/**
 * Orbital spacing configuration
 * Ensures even distribution and prevents overlaps
 */
export const ORBITAL_SPACING = {
  /**
   * Base orbital radius (distance from star)
   * Orbital radius for the innermost planet (index 0)
   */
  BASE_RADIUS: 4.0,
  
  /**
   * Spacing increment between planet orbits
   * Increases linearly with planet index
   */
  RADIUS_INCREMENT: 3.0,
  
  /**
   * Minimum safe distance between adjacent planet orbits
   * Prevents visual overlap considering planet sizes
   */
  MIN_SEPARATION: 2.0,
  
  /**
   * Maximum eccentricity (orbit ellipticity)
   * Keeps orbits mostly circular for predictable spacing
   */
  MAX_ECCENTRICITY: 0.05,
  
  /**
   * Maximum orbital inclination (in radians)
   * Creates 3D depth while avoiding z-fighting
   */
  MAX_INCLINATION: 0.15,
  
  /**
   * Planet count threshold for adaptive spacing
   * Systems with more planets get increased spacing to prevent crowding
   */
  ADAPTIVE_SPACING_THRESHOLD: 8,
} as const;

/**
 * Star configuration
 */
export const STAR_SCALE = {
  /**
   * Central star radius
   * Sized to be visible but not dominant
   */
  RADIUS: 1.2,
  
  /**
   * Star light intensity
   */
  LIGHT_INTENSITY: 2.5,
  
  /**
   * Star light distance
   */
  LIGHT_DISTANCE: 30,
} as const;

/**
 * Calculate planet size based on moon count
 * Ensures size stays within min/max bounds
 */
export function calculatePlanetSize(moonCount: number): number {
  const sizeWithMoons = PLANET_SCALE.MIN_SIZE + (moonCount * PLANET_SCALE.MOON_MULTIPLIER);
  return Math.min(PLANET_SCALE.MAX_SIZE, sizeWithMoons);
}

/**
 * Calculate moon size based on planet scale constants
 * Maintains consistent visual hierarchy
 */
export function calculateMoonSize(): number {
  return PLANET_SCALE.MIN_SIZE * PLANET_SCALE.MOON_SIZE_RATIO;
}

/**
 * Calculate orbital radius for a planet at given index
 * Ensures even spacing that accommodates planet sizes
 */
export function calculateOrbitalRadius(planetIndex: number): number {
  return ORBITAL_SPACING.BASE_RADIUS + (planetIndex * ORBITAL_SPACING.RADIUS_INCREMENT);
}

/**
 * Calculate safe orbital spacing considering planet sizes
 * Ensures no overlap between adjacent planets
 */
export function calculateSafeSpacing(planetCount: number): number {
  if (planetCount <= 1) return ORBITAL_SPACING.RADIUS_INCREMENT;
  
  // For many planets, increase spacing to prevent crowding
  const densityFactor = Math.max(1.0, planetCount / ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
  return ORBITAL_SPACING.RADIUS_INCREMENT * densityFactor;
}

/**
 * Galaxy size configuration
 * Scales galaxies based on total count to optimize canvas usage
 */
export const GALAXY_SCALE = {
  /**
   * Minimum galaxy radius in Three.js units
   * Used when there are many galaxies (50+)
   */
  MIN_RADIUS: 4,
  
  /**
   * Maximum galaxy radius in Three.js units
   * Used when there are few galaxies (1-2)
   */
  MAX_RADIUS: 15,
  
  /**
   * Base galaxy radius for reference
   * Used as default when no scaling is applied
   */
  BASE_RADIUS: 8,
  
  /**
   * Count threshold for minimum size
   * Galaxies at or above this count use MIN_RADIUS
   */
  MIN_SIZE_THRESHOLD: 50,
  
  /**
   * Count threshold for maximum size
   * Galaxies at or below this count use MAX_RADIUS
   */
  MAX_SIZE_THRESHOLD: 2,
  
  /**
   * Smoothing factor for scale transitions
   * Higher values create more gradual size changes when galaxies are added/removed
   */
  SMOOTHING_FACTOR: 0.8,
} as const;

/**
 * Calculate galaxy render radius based on total galaxy count
 * Implements a smooth logarithmic scale to prevent jarring size changes
 * 
 * @param galaxyCount Total number of galaxies in the universe
 * @returns Object with minRadius and maxRadius for galaxy particle distribution
 * 
 * @example
 * // Few galaxies fill the canvas
 * calculateGalaxyScale(1) // { minRadius: 3, maxRadius: 15 }
 * 
 * // Many galaxies shrink to fit
 * calculateGalaxyScale(50) // { minRadius: 0.8, maxRadius: 4 }
 */
export function calculateGalaxyScale(galaxyCount: number): { minRadius: number; maxRadius: number } {
  // Handle edge cases
  if (galaxyCount <= 0) {
    return { minRadius: GALAXY_SCALE.BASE_RADIUS * 0.25, maxRadius: GALAXY_SCALE.BASE_RADIUS };
  }
  
  if (galaxyCount <= GALAXY_SCALE.MAX_SIZE_THRESHOLD) {
    // Few galaxies: use maximum size to fill canvas
    return { minRadius: GALAXY_SCALE.MAX_RADIUS * 0.2, maxRadius: GALAXY_SCALE.MAX_RADIUS };
  }
  
  if (galaxyCount >= GALAXY_SCALE.MIN_SIZE_THRESHOLD) {
    // Many galaxies: use minimum size to avoid crowding
    return { minRadius: GALAXY_SCALE.MIN_RADIUS * 0.2, maxRadius: GALAXY_SCALE.MIN_RADIUS };
  }
  
  // Intermediate counts: smooth logarithmic interpolation
  // Use log scale to prevent jarring transitions when adding/removing galaxies
  const logMin = Math.log(GALAXY_SCALE.MAX_SIZE_THRESHOLD);
  const logMax = Math.log(GALAXY_SCALE.MIN_SIZE_THRESHOLD);
  const logCount = Math.log(galaxyCount);
  
  // Calculate interpolation factor (0 = few galaxies, 1 = many galaxies)
  const t = (logCount - logMin) / (logMax - logMin);
  
  // Apply smoothing to reduce sudden jumps
  const smoothT = Math.pow(t, GALAXY_SCALE.SMOOTHING_FACTOR);
  
  // Interpolate between max and min radius
  const maxRadius = GALAXY_SCALE.MAX_RADIUS - (GALAXY_SCALE.MAX_RADIUS - GALAXY_SCALE.MIN_RADIUS) * smoothT;
  const minRadius = maxRadius * 0.2; // Min is always 20% of max for good particle distribution
  
  return { minRadius, maxRadius };
}

/**
 * Calculate galaxy render radius with manual override support
 * Allows specific galaxies to have fixed sizes independent of global scaling
 * 
 * @param galaxyCount Total number of galaxies in the universe
 * @param manualRadius Optional fixed radius for this specific galaxy
 * @returns Object with minRadius and maxRadius for galaxy particle distribution
 */
export function calculateGalaxyScaleWithOverride(
  galaxyCount: number,
  manualRadius?: number
): { minRadius: number; maxRadius: number } {
  if (manualRadius !== undefined && manualRadius > 0) {
    // Use manual override
    return { minRadius: manualRadius * 0.2, maxRadius: manualRadius };
  }
  
  // Use automatic scaling
  return calculateGalaxyScale(galaxyCount);
}
