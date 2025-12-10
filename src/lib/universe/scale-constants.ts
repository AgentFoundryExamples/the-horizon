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
  MOON_MULTIPLIER: 0.04,
  
  /**
   * Moon size multiplier relative to minimum planet size
   * Maintains visual hierarchy where moons are smaller than planets
   */
  MOON_SIZE_RATIO: 0.15,
} as const;

/**
 * Orbital spacing configuration
 * Ensures even distribution and prevents overlaps
 * 
 * DETERMINISTIC ORBIT RULES:
 * - Planets orbit in circular paths centered on the star
 * - Orbital radius = BASE_RADIUS + (planet_index × spacing)
 * - Spacing scales automatically for systems with many planets
 * - Eccentricity and inclination are minimal for predictability
 * - Starting positions are evenly distributed around orbit
 * - Orbital speeds follow Kepler's third law (inner planets faster)
 * 
 * CONFIGURATION NOTES:
 * - BASE_RADIUS: First planet starts at this distance from star
 * - RADIUS_INCREMENT: Base spacing between adjacent orbits
 * - Spacing adapts when planet count exceeds ADAPTIVE_SPACING_THRESHOLD
 * - Small eccentricity/inclination adds visual interest while maintaining determinism
 */
export const ORBITAL_SPACING = {
  /**
   * Base orbital radius (distance from star)
   * Orbital radius for the innermost planet (index 0)
   * 
   * This value ensures clear separation from the central star (radius 1.2)
   * Minimum value should be > 2× star radius to prevent visual overlap
   */
  BASE_RADIUS: 4.0,
  
  /**
   * Spacing increment between planet orbits
   * Increases linearly with planet index
   * 
   * For planet at index i:
   *   radius = BASE_RADIUS + (i × RADIUS_INCREMENT × density_factor)
   * 
   * Where density_factor = max(1.0, planet_count / ADAPTIVE_SPACING_THRESHOLD)
   * 
   * This value is large enough to prevent overlap even with max-sized planets
   */
  RADIUS_INCREMENT: 3.0,
  
  /**
   * Minimum safe distance between adjacent planet orbits
   * Prevents visual overlap considering planet sizes
   * 
   * Note: This is a guideline value. Actual spacing is computed dynamically
   * via calculateSafeSpacing() to accommodate planet sizes and count
   */
  MIN_SEPARATION: 2.0,
  
  /**
   * Maximum eccentricity (orbit ellipticity)
   * Keeps orbits mostly circular for predictable spacing
   * 
   * Value of 0.05 = 5% ellipticity (nearly circular)
   * Actual eccentricity used in SolarSystemView is 30% of this (0.015)
   * This creates visually circular orbits while maintaining determinism
   */
  MAX_ECCENTRICITY: 0.05,
  
  /**
   * Maximum orbital inclination (in radians)
   * Creates 3D depth while avoiding z-fighting
   * 
   * Value of 0.15 radians ≈ 8.6 degrees
   * Actual inclination used is 50% of this (0.075 rad ≈ 4.3°)
   * Small inclination prevents planets from appearing perfectly flat
   * while keeping orbits predictable
   */
  MAX_INCLINATION: 0.15,
  
  /**
   * Planet count threshold for adaptive spacing
   * Systems with more planets get increased spacing to prevent crowding
   * 
   * When planet_count > ADAPTIVE_SPACING_THRESHOLD:
   *   spacing = RADIUS_INCREMENT × (planet_count / ADAPTIVE_SPACING_THRESHOLD)
   * 
   * Example with threshold=8:
   * - 4 planets: uses standard 3.0 spacing
   * - 8 planets: uses standard 3.0 spacing (threshold)
   * - 12 planets: uses 4.5 spacing (1.5× standard)
   * - 16 planets: uses 6.0 spacing (2× standard)
   */
  ADAPTIVE_SPACING_THRESHOLD: 8,
  
  /**
   * Viewport radius constraint for solar system view
   * Maximum distance from center where planets should remain visible
   * Based on typical camera distance and field of view
   * 
   * Solar system camera position: (0, 10, 25)
   * Camera FOV: 75 degrees
   * Comfortable viewing radius: ~30-35 units
   */
  VIEWPORT_RADIUS_SOLAR: 32,
  
  /**
   * Viewport radius constraint for galaxy view
   * Maximum distance for miniature solar systems in galaxy view
   * 
   * Galaxy view has tighter constraints due to smaller scale
   */
  VIEWPORT_RADIUS_GALAXY: 12,
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
 * Uses fixed spacing without adaptive scaling
 * 
 * Note: For actual rendering, SolarSystemView uses calculateSafeSpacing()
 * which applies adaptive spacing for systems with many planets.
 * This function is provided for simple calculations and testing.
 * 
 * @param planetIndex - Zero-based index of the planet (0 = innermost)
 * @returns Orbital radius in Three.js units
 */
export function calculateOrbitalRadius(planetIndex: number): number {
  return ORBITAL_SPACING.BASE_RADIUS + (planetIndex * ORBITAL_SPACING.RADIUS_INCREMENT);
}

/**
 * Calculate orbital radius for a planet with adaptive spacing
 * Uses adaptive spacing that scales with total planet count
 * This matches the actual implementation in SolarSystemView
 * 
 * @param planetIndex - Zero-based index of the planet (0 = innermost)
 * @param totalPlanets - Total number of planets in the system
 * @returns Orbital radius in Three.js units with adaptive spacing applied
 * 
 * @deprecated Use calculateDynamicOrbitalRadius for size-aware spacing
 */
export function calculateAdaptiveOrbitalRadius(planetIndex: number, totalPlanets: number): number {
  const spacing = calculateSafeSpacing(totalPlanets);
  return ORBITAL_SPACING.BASE_RADIUS + (planetIndex * spacing);
}

/**
 * Calculate orbital radius with dynamic spacing based on planet sizes
 * 
 * @param planetIndex - Zero-based index of the planet (0 = innermost)
 * @param spacing - Pre-calculated spacing value from calculateDynamicSpacing
 * @returns Orbital radius in Three.js units
 */
export function calculateDynamicOrbitalRadius(planetIndex: number, spacing: number): number {
  return ORBITAL_SPACING.BASE_RADIUS + (planetIndex * spacing);
}

/**
 * Planet size information for spacing calculations
 */
export interface PlanetSizeInfo {
  /** Zero-based index of the planet in the system */
  index: number;
  /** Radius of the planet in Three.js units */
  radius: number;
}

/**
 * Calculate safe orbital spacing considering planet count
 * Ensures no overlap between adjacent planets
 * 
 * @param planetCount - Total number of planets in the system
 * @returns Spacing between orbits in Three.js units
 * 
 * @deprecated Use calculateDynamicSpacing for size-aware spacing
 */
export function calculateSafeSpacing(planetCount: number): number {
  if (planetCount <= 1) return ORBITAL_SPACING.RADIUS_INCREMENT;
  
  // For many planets, increase spacing to prevent crowding
  const densityFactor = Math.max(1.0, planetCount / ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
  return ORBITAL_SPACING.RADIUS_INCREMENT * densityFactor;
}

/**
 * Calculate dynamic orbital spacing considering individual planet sizes
 * Ensures no overlap by accounting for the actual radii of adjacent planets
 * 
 * @param planets - Array of planet size information (index and radius)
 * @param baseSpacing - Base spacing to use (defaults to RADIUS_INCREMENT)
 * @param viewportRadius - Optional maximum radius constraint for viewport bounds
 * @returns Spacing value in Three.js units
 */
export function calculateDynamicSpacing(
  planets: PlanetSizeInfo[],
  baseSpacing: number = ORBITAL_SPACING.RADIUS_INCREMENT,
  viewportRadius?: number
): number {
  if (planets.length <= 1) return baseSpacing;
  
  // Apply density factor for many planets
  const densityFactor = Math.max(1.0, planets.length / ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
  let spacing = baseSpacing * densityFactor;
  
  // Check if any adjacent planets would overlap with current spacing
  // and increase spacing if needed
  for (let i = 0; i < planets.length - 1; i++) {
    const current = planets[i];
    const next = planets[i + 1];
    
    // Calculate radial distance between orbits
    const currentOrbitRadius = ORBITAL_SPACING.BASE_RADIUS + current.index * spacing;
    const nextOrbitRadius = ORBITAL_SPACING.BASE_RADIUS + next.index * spacing;
    const orbitGap = nextOrbitRadius - currentOrbitRadius;
    
    // Minimum gap needed: sum of planet radii plus safety margin
    const safetyMargin = ORBITAL_SPACING.MIN_SEPARATION;
    const minGapNeeded = current.radius + next.radius + safetyMargin;
    
    // If gap is insufficient, increase spacing
    if (orbitGap < minGapNeeded) {
      const requiredSpacing = minGapNeeded / (next.index - current.index);
      spacing = Math.max(spacing, requiredSpacing);
    }
  }
  
  // Check viewport constraints if provided
  if (viewportRadius) {
    const outermostPlanet = planets[planets.length - 1];
    
    // Calculate if current spacing fits in viewport
    let outermostRadius = ORBITAL_SPACING.BASE_RADIUS + outermostPlanet.index * spacing;
    let totalRadius = outermostRadius + outermostPlanet.radius;
    
    // If system extends beyond viewport, try to scale down spacing
    if (totalRadius > viewportRadius) {
      // Calculate maximum spacing that keeps outermost planet in viewport
      const maxAllowedRadius = viewportRadius - outermostPlanet.radius;
      const maxSpacing = (maxAllowedRadius - ORBITAL_SPACING.BASE_RADIUS) / outermostPlanet.index;
      
      // Check if this scaled spacing would cause overlaps
      const minSpacingForSafety = calculateMinimumSpacingForPlanets(planets);
      
      if (maxSpacing >= minSpacingForSafety) {
        // Safe to use viewport-constrained spacing
        spacing = maxSpacing;
      } else {
        // Cannot fit without overlap - prioritize safety over viewport
        // Only log warning in development to avoid console pollution in production
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Planetary system spacing constraint: ${planets.length} planets require ` +
            `${minSpacingForSafety.toFixed(2)} units but viewport allows ${maxSpacing.toFixed(2)} units. ` +
            `Using safe spacing to prevent overlap.`
          );
        }
        spacing = minSpacingForSafety;
      }
    }
  }
  
  return spacing;
}

/**
 * Calculate the minimum spacing required to prevent any planet overlap
 * 
 * @param planets - Array of planet size information
 * @returns Minimum spacing in Three.js units
 */
export function calculateMinimumSpacingForPlanets(planets: PlanetSizeInfo[]): number {
  if (planets.length <= 1) return ORBITAL_SPACING.RADIUS_INCREMENT;
  
  let maxRequiredSpacing: number = ORBITAL_SPACING.RADIUS_INCREMENT;
  
  for (let i = 0; i < planets.length - 1; i++) {
    const current = planets[i];
    const next = planets[i + 1];
    
    // Minimum gap needed between orbits
    const safetyMargin = ORBITAL_SPACING.MIN_SEPARATION;
    const minGapNeeded = current.radius + next.radius + safetyMargin;
    
    // Spacing required to achieve this gap
    const requiredSpacing = minGapNeeded / (next.index - current.index);
    maxRequiredSpacing = Math.max(maxRequiredSpacing, requiredSpacing);
  }
  
  return maxRequiredSpacing;
}

/**
 * Galaxy view ring configuration
 * Defines the radii of rings where solar systems and stars are placed
 * 
 * RING ALIGNMENT RULES:
 * - Solar systems sit on the inner ring (SOLAR_SYSTEM_RING_RADIUS)
 * - Free-floating stars sit on the outer ring (STAR_RING_RADIUS)
 * - Markers are positioned using polar coordinates at exact ring radii
 * - Angular spacing divides 2π by object count for even distribution
 * - Rings are visualized with semi-transparent orbit lines
 * 
 * VISUAL HIERARCHY:
 * - Galaxy-level rings are more prominent (higher opacity, thicker strokes)
 * - These rings guide understanding of solar system and star positions
 * - Color: cyan/blue (#4A90E2) indicates galaxy-scale orbital paths
 */
export const GALAXY_VIEW_SCALE = {
  /**
   * Radius of the ring where solar systems are placed
   * Solar systems are positioned at exact intervals around this ring
   */
  SOLAR_SYSTEM_RING_RADIUS: 10,
  
  /**
   * Radius of the ring where free-floating stars are placed
   * Stars are positioned at exact intervals around this ring, offset by π/4
   */
  STAR_RING_RADIUS: 15,
  
  /**
   * Number of segments for smooth circle rendering
   */
  RING_SEGMENTS: 64,
} as const;

/**
 * Orbit ring styling tokens
 * Define visual appearance for galaxy-level and solar-system-level orbit rings
 * 
 * DESIGN RATIONALE:
 * - Galaxy orbits: More prominent to establish spatial organization of systems/stars
 * - Solar orbits: More subtle to avoid overwhelming planet detail view
 * - Both use blue family colors to maintain visual consistency
 * - Opacity and stroke weight differentiate the scales
 */

/**
 * Galaxy-level orbit ring styling
 * Used for solar system and star placement rings in GalaxyView
 * These rings are structural guides showing how objects are organized
 */
export const GALAXY_ORBIT_STYLE = {
  /**
   * Color for galaxy-level orbit rings
   * Cyan/blue indicates macro-scale orbital structures
   */
  COLOR: '#4A90E2',
  
  /**
   * Opacity for galaxy-level rings
   * Higher opacity (0.4) makes structural organization clear
   */
  OPACITY: 0.4,
  
  /**
   * Line width for galaxy orbit rings
   * Note: lineWidth may not render consistently across all WebGL implementations
   */
  LINE_WIDTH: 2,
  
  /**
   * Dash pattern for galaxy rings
   * Solid lines (undefined) for continuous structural guides
   */
  DASH_PATTERN: undefined,
} as const;

/**
 * Solar system-level orbit ring styling
 * Used for planet orbital paths in SolarSystemView
 * These rings are subtle guides for individual planet trajectories
 */
export const SOLAR_ORBIT_STYLE = {
  /**
   * Color for solar system-level orbit rings
   * Lighter blue-gray indicates individual planet orbits
   */
  COLOR: '#7BA5D1',
  
  /**
   * Opacity for solar system rings
   * Lower opacity (0.2) keeps focus on planets, not guides
   */
  OPACITY: 0.2,
  
  /**
   * Line width for solar orbit rings
   * Thinner than galaxy rings to reinforce hierarchy
   */
  LINE_WIDTH: 1,
  
  /**
   * Dash pattern for solar rings
   * Dashed pattern [2, 2] distinguishes from galaxy solid lines
   */
  DASH_PATTERN: [2, 2],
} as const;

/**
 * Galaxy size configuration
 * Scales galaxies based on total count to optimize canvas usage
 * 
 * TUNING GUIDE:
 * - To increase overall galaxy size: raise MIN_RADIUS and MAX_RADIUS proportionally
 * - Ensure grid spacing (50 units in UniverseScene) > 2× MAX_RADIUS to prevent overlap
 * - If changing MAX_RADIUS, verify camera positions still frame galaxies properly
 * - Test with 1, 5, 10, and 50+ galaxies to ensure smooth scaling
 */
export const GALAXY_SCALE = {
  /**
   * Minimum galaxy radius in Three.js units
   * Used when there are many galaxies (50+)
   * Increased from 4 to 6 for better visibility and screen presence
   * Further increased to 8 for improved click targets
   */
  MIN_RADIUS: 8,
  
  /**
   * Maximum galaxy radius in Three.js units
   * Used when there are few galaxies (1-2)
   * Increased from 15 to 22 for improved focus and immersion
   * Further increased to 28 for better click targets and visual presence
   */
  MAX_RADIUS: 28,
  
  /**
   * Base galaxy radius for reference
   * Used as default when no scaling is applied
   * Adjusted proportionally to maintain balance
   */
  BASE_RADIUS: 15,
  
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
  
  /**
   * Ratio of minimum to maximum radius for particle distribution
   * minRadius is always RADIUS_RATIO * maxRadius to maintain proper spiral shape
   * A ratio of 0.2 (20%) ensures particles are well-distributed from center to edge
   */
  RADIUS_RATIO: 0.2,
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
    return { minRadius: GALAXY_SCALE.BASE_RADIUS * GALAXY_SCALE.RADIUS_RATIO, maxRadius: GALAXY_SCALE.BASE_RADIUS };
  }
  
  if (galaxyCount <= GALAXY_SCALE.MAX_SIZE_THRESHOLD) {
    // Few galaxies: use maximum size to fill canvas
    return { minRadius: GALAXY_SCALE.MAX_RADIUS * GALAXY_SCALE.RADIUS_RATIO, maxRadius: GALAXY_SCALE.MAX_RADIUS };
  }
  
  if (galaxyCount >= GALAXY_SCALE.MIN_SIZE_THRESHOLD) {
    // Many galaxies: use minimum size to avoid crowding
    return { minRadius: GALAXY_SCALE.MIN_RADIUS * GALAXY_SCALE.RADIUS_RATIO, maxRadius: GALAXY_SCALE.MIN_RADIUS };
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
  const minRadius = maxRadius * GALAXY_SCALE.RADIUS_RATIO;
  
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
    return { minRadius: manualRadius * GALAXY_SCALE.RADIUS_RATIO, maxRadius: manualRadius };
  }
  
  // Use automatic scaling
  return calculateGalaxyScale(galaxyCount);
}

/**
 * Scale presets for PlanetarySystem component
 * These presets define the visual parameters for planetary systems at different scales
 */

/**
 * Galaxy view scale preset
 * Used for miniature solar systems displayed within galaxy view
 * Small scale with tighter orbits for compact representation
 */
export const GALAXY_VIEW_PLANETARY_SCALE = {
  // Star properties
  starRadius: 0.5,
  starLightIntensity: 1,
  starLightDistance: 20,
  // Orbit properties
  orbitBaseRadius: 2,      // Tighter starting radius
  orbitSpacing: 1.5,       // Closer orbit spacing
  orbitEccentricity: 0.1,  // Slight ellipse
  orbitInclination: 0.2,   // Small inclination for 3D effect
  // Planet properties
  planetBaseSize: 0.3,     // Smaller planets
  planetSizeIncrement: 0.05, // Small size increase per moon
  // Viewport constraints
  viewportRadius: ORBITAL_SPACING.VIEWPORT_RADIUS_GALAXY,
  // Orbit ring styling
  orbitRingColor: GALAXY_ORBIT_STYLE.COLOR,
  orbitRingOpacity: GALAXY_ORBIT_STYLE.OPACITY,
  orbitRingLineWidth: GALAXY_ORBIT_STYLE.LINE_WIDTH,
  orbitRingDashPattern: GALAXY_ORBIT_STYLE.DASH_PATTERN,
  orbitRingSegments: GALAXY_VIEW_SCALE.RING_SEGMENTS,
} as const;

/**
 * Solar system view scale preset
 * Used for dedicated solar system view with full detail
 * Larger scale with wider orbits for detailed exploration
 */
export const SOLAR_SYSTEM_VIEW_PLANETARY_SCALE = {
  // Star properties
  starRadius: STAR_SCALE.RADIUS,
  starLightIntensity: STAR_SCALE.LIGHT_INTENSITY,
  starLightDistance: STAR_SCALE.LIGHT_DISTANCE,
  // Orbit properties
  orbitBaseRadius: ORBITAL_SPACING.BASE_RADIUS,
  orbitSpacing: ORBITAL_SPACING.RADIUS_INCREMENT,
  orbitEccentricity: ORBITAL_SPACING.MAX_ECCENTRICITY * 0.3, // 30% of max for near-circular orbits
  orbitInclination: ORBITAL_SPACING.MAX_INCLINATION * 0.5,   // 50% of max for mostly flat plane
  // Planet properties
  planetBaseSize: PLANET_SCALE.MIN_SIZE,
  planetSizeIncrement: PLANET_SCALE.MOON_MULTIPLIER,
  // Viewport constraints
  viewportRadius: ORBITAL_SPACING.VIEWPORT_RADIUS_SOLAR,
  // Orbit ring styling
  orbitRingColor: SOLAR_ORBIT_STYLE.COLOR,
  orbitRingOpacity: SOLAR_ORBIT_STYLE.OPACITY,
  orbitRingLineWidth: SOLAR_ORBIT_STYLE.LINE_WIDTH,
  orbitRingDashPattern: SOLAR_ORBIT_STYLE.DASH_PATTERN,
  orbitRingSegments: 64,
} as const;
