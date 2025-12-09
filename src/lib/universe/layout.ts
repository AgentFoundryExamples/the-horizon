/**
 * Galaxy layout system for symmetric universe positioning
 * Provides deterministic, symmetrical layouts based on galaxy count
 */

import * as THREE from 'three';

/**
 * Layout configuration for a positioned galaxy
 */
export interface GalaxyPosition {
  id: string;
  position: THREE.Vector3;
}

/**
 * Layout calculation result
 */
export interface GalaxyLayout {
  positions: Map<string, THREE.Vector3>;
  boundingRadius: number; // Maximum distance from origin
}

/**
 * Minimum spacing between galaxy centers to prevent overlap
 * Based on GALAXY_SCALE.MAX_RADIUS=22, diameter=44, spacing should be > 50
 */
const MIN_GALAXY_SPACING = 50;

/**
 * Calculate symmetric layout positions for galaxies based on count
 * 
 * Layout patterns:
 * - 1 galaxy: Centered at origin
 * - 2 galaxies: Mirrored horizontally on X-axis
 * - 3 galaxies: Triangular arrangement
 * - 4 galaxies: Square/diamond arrangement
 * - 5+ galaxies: Circular ring with even spacing
 * 
 * @param galaxyIds - Array of galaxy IDs to position
 * @param spacing - Minimum spacing between galaxy centers (default: MIN_GALAXY_SPACING)
 * @returns GalaxyLayout with position map and bounding radius
 */
export function calculateGalaxyLayout(
  galaxyIds: string[],
  spacing: number = MIN_GALAXY_SPACING
): GalaxyLayout {
  const positions = new Map<string, THREE.Vector3>();
  const count = galaxyIds.length;
  
  // Handle edge case: no galaxies
  if (count === 0) {
    return { positions, boundingRadius: 0 };
  }
  
  let boundingRadius = 0;
  
  // Pattern 1: Single galaxy - centered at origin
  if (count === 1) {
    positions.set(galaxyIds[0], new THREE.Vector3(0, 0, 0));
    boundingRadius = 0;
  }
  
  // Pattern 2: Two galaxies - mirrored horizontally
  else if (count === 2) {
    const offset = spacing / 2;
    positions.set(galaxyIds[0], new THREE.Vector3(-offset, 0, 0));
    positions.set(galaxyIds[1], new THREE.Vector3(offset, 0, 0));
    boundingRadius = offset;
  }
  
  // Pattern 3: Three galaxies - equilateral triangle
  else if (count === 3) {
    // Arrange in equilateral triangle centered at origin
    // Height of equilateral triangle: h = (√3/2) * side
    const side = spacing;
    const height = (Math.sqrt(3) / 2) * side;
    const centerOffset = height / 3; // Distance from base to centroid
    
    // Top vertex (pointing up in -Z direction)
    positions.set(galaxyIds[0], new THREE.Vector3(0, 0, -(height - centerOffset)));
    // Bottom-left vertex
    positions.set(galaxyIds[1], new THREE.Vector3(-side / 2, 0, centerOffset));
    // Bottom-right vertex
    positions.set(galaxyIds[2], new THREE.Vector3(side / 2, 0, centerOffset));
    
    // Bounding radius is distance from center to any vertex
    boundingRadius = height - centerOffset;
  }
  
  // Pattern 4: Four galaxies - square arrangement
  else if (count === 4) {
    // Arrange in a square rotated 45° (diamond shape).
    // To make the side length equal to `spacing`, the distance from the center
    // to a vertex must be `spacing / sqrt(2)`.
    const distanceToVertex = spacing / Math.sqrt(2);
    
    // Place vertices at the four cardinal directions
    positions.set(galaxyIds[0], new THREE.Vector3(0, 0, -distanceToVertex)); // North
    positions.set(galaxyIds[1], new THREE.Vector3(-distanceToVertex, 0, 0)); // West
    positions.set(galaxyIds[2], new THREE.Vector3(distanceToVertex, 0, 0));  // East
    positions.set(galaxyIds[3], new THREE.Vector3(0, 0, distanceToVertex));  // South
    
    boundingRadius = distanceToVertex;
  }
  
  // Pattern 5: Five or more galaxies - circular ring
  else {
    // Calculate radius to maintain spacing between adjacent galaxies on the circle
    // Arc length between adjacent points: 2πr/n = spacing
    // Therefore: r = (n * spacing) / (2π)
    const radius = (count * spacing) / (2 * Math.PI);
    
    galaxyIds.forEach((id, index) => {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.set(id, new THREE.Vector3(x, 0, z));
    });
    
    boundingRadius = radius;
  }
  
  return { positions, boundingRadius };
}

/**
 * Get the recommended camera distance for viewing the entire layout
 * @param boundingRadius - Maximum distance from origin to any galaxy
 * @param galaxyMaxRadius - Maximum radius of an individual galaxy
 * @returns Recommended camera distance from origin
 */
export function getRecommendedCameraDistance(
  boundingRadius: number,
  galaxyMaxRadius: number = 22
): number {
  // Camera should see all galaxies plus some margin
  // Field of view considerations: typical FOV is 75°
  // At 75° FOV, to see width W at distance D: D ≈ W / (2 * tan(37.5°))
  const totalRadius = boundingRadius + galaxyMaxRadius;
  const fovRadians = (75 * Math.PI) / 180;
  const minDistance = totalRadius / Math.tan(fovRadians / 2);
  
  // Add 30% margin for comfortable viewing
  return minDistance * 1.3;
}

/**
 * Validate that spacing is sufficient to prevent galaxy overlap
 * @param spacing - Spacing to validate
 * @param galaxyMaxDiameter - Maximum diameter of any galaxy
 * @returns true if spacing is sufficient
 */
export function validateSpacing(
  spacing: number,
  galaxyMaxDiameter: number = 44
): boolean {
  return spacing > galaxyMaxDiameter;
}

/**
 * Validate that spacing is sufficient for circular ring layout (5+ galaxies)
 * Checks chord distance between adjacent galaxies on the ring
 * @param galaxyCount - Number of galaxies in the ring
 * @param spacing - Spacing used to calculate ring radius
 * @param galaxyMaxDiameter - Maximum diameter of any galaxy
 * @returns true if chord distance between adjacent galaxies exceeds diameter
 */
export function validateRingSpacing(
  galaxyCount: number,
  spacing: number,
  galaxyMaxDiameter: number = 44
): boolean {
  if (galaxyCount < 5) {
    return true; // Not a ring layout
  }
  
  // Calculate ring radius: r = (n * spacing) / (2π)
  const radius = (galaxyCount * spacing) / (2 * Math.PI);
  
  // Calculate angle between adjacent galaxies
  const angleStep = (2 * Math.PI) / galaxyCount;
  
  // Calculate chord distance between adjacent galaxies
  // Chord length = 2r * sin(θ/2)
  const chordDistance = 2 * radius * Math.sin(angleStep / 2);
  
  // Chord distance must exceed galaxy diameter to prevent overlap
  return chordDistance > galaxyMaxDiameter;
}
