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
   * Scales with number of moons
   */
  BASE_SIZE: 1.0,
  
  /**
   * Size increment per moon
   * Adds visual variety while maintaining reasonable sizes
   */
  MOON_MULTIPLIER: 0.1,
} as const;

/**
 * Orbital spacing configuration
 * Ensures even distribution and prevents overlaps
 */
export const ORBITAL_SPACING = {
  /**
   * Base orbital radius (distance from star)
   * First planet orbit distance
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
  const baseSize = PLANET_SCALE.BASE_SIZE + (moonCount * PLANET_SCALE.MOON_MULTIPLIER);
  return Math.max(
    PLANET_SCALE.MIN_SIZE,
    Math.min(PLANET_SCALE.MAX_SIZE, baseSize)
  );
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
  const densityFactor = Math.max(1.0, planetCount / 8);
  return ORBITAL_SPACING.RADIUS_INCREMENT * densityFactor;
}
