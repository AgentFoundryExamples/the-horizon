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
 * Tests for dynamic orbit spacing to prevent planet overlap
 */

import {
  calculateDynamicSpacing,
  calculateMinimumSpacingForPlanets,
  calculateDynamicOrbitalRadius,
  ORBITAL_SPACING,
  type PlanetSizeInfo,
} from '../scale-constants';

// Floating point comparison tolerance for geometric calculations
const FLOATING_POINT_TOLERANCE = 0.001;

describe('Dynamic Orbit Spacing', () => {
  describe('calculateDynamicSpacing', () => {
    it('should return base spacing for single planet', () => {
      const planets: PlanetSizeInfo[] = [{ index: 0, radius: 0.8 }];
      const spacing = calculateDynamicSpacing(planets);
      expect(spacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should prevent overlap between uniform-sized planets', () => {
      // 5 planets, all size 1.0
      const planets: PlanetSizeInfo[] = Array.from({ length: 5 }, (_, i) => ({
        index: i,
        radius: 1.0,
      }));
      
      const spacing = calculateDynamicSpacing(planets);
      
      // Verify no overlaps - use actual planet indices from data
      for (let i = 0; i < planets.length - 1; i++) {
        const current = planets[i];
        const next = planets[i + 1];
        const currentOrbit = calculateDynamicOrbitalRadius(current.index, spacing);
        const nextOrbit = calculateDynamicOrbitalRadius(next.index, spacing);
        const gap = nextOrbit - currentOrbit;
        const minGap = current.radius + next.radius + ORBITAL_SPACING.MIN_SEPARATION;
        
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
      }
    });

    it('should increase spacing for larger planets', () => {
      const smallPlanets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.5 },
        { index: 1, radius: 0.5 },
        { index: 2, radius: 0.5 },
      ];
      
      const largePlanets: PlanetSizeInfo[] = [
        { index: 0, radius: 1.5 },
        { index: 1, radius: 1.5 },
        { index: 2, radius: 1.5 },
      ];
      
      const smallSpacing = calculateDynamicSpacing(smallPlanets);
      const largeSpacing = calculateDynamicSpacing(largePlanets);
      
      expect(largeSpacing).toBeGreaterThan(smallSpacing);
    });

    it('should handle mixed planet sizes', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.8 },  // Small
        { index: 1, radius: 1.8 },  // Large
        { index: 2, radius: 0.9 },  // Small
        { index: 3, radius: 1.5 },  // Medium
      ];
      
      const spacing = calculateDynamicSpacing(planets);
      
      // Check all pairs don't overlap
      for (let i = 0; i < planets.length - 1; i++) {
        const currentRadius = ORBITAL_SPACING.BASE_RADIUS + i * spacing;
        const nextRadius = ORBITAL_SPACING.BASE_RADIUS + (i + 1) * spacing;
        const gap = nextRadius - currentRadius;
        const minGap = planets[i].radius + planets[i + 1].radius + ORBITAL_SPACING.MIN_SEPARATION;
        
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE); // Allow small floating point error
      }
    });

    it('should respect viewport constraints when possible', () => {
      // Smaller planets that can fit with some spacing adjustment
      const planets: PlanetSizeInfo[] = Array.from({ length: 8 }, (_, i) => ({
        index: i,
        radius: 0.6, // Smaller than default to allow fitting
      }));
      
      const viewportRadius = 30;
      const spacing = calculateDynamicSpacing(planets, ORBITAL_SPACING.RADIUS_INCREMENT, viewportRadius);
      
      // Check that outermost planet stays within viewport
      const outermostPlanet = planets[planets.length - 1];
      const outermostOrbitRadius = ORBITAL_SPACING.BASE_RADIUS + outermostPlanet.index * spacing;
      const totalRadius = outermostOrbitRadius + outermostPlanet.radius;
      
      expect(totalRadius).toBeLessThanOrEqual(viewportRadius + 0.1); // Allow small margin
      
      // Also verify no overlaps
      for (let i = 0; i < planets.length - 1; i++) {
        const currentRadius = ORBITAL_SPACING.BASE_RADIUS + i * spacing;
        const nextRadius = ORBITAL_SPACING.BASE_RADIUS + (i + 1) * spacing;
        const gap = nextRadius - currentRadius;
        const minGap = planets[i].radius + planets[i + 1].radius + ORBITAL_SPACING.MIN_SEPARATION;
        
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
      }
    });

    it('should maintain safety even with tight viewport', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 1.5 },
        { index: 1, radius: 1.5 },
        { index: 2, radius: 1.5 },
      ];
      
      // Very tight viewport that can't fit without overlap
      const tightViewport = 10;
      const spacing = calculateDynamicSpacing(planets, ORBITAL_SPACING.RADIUS_INCREMENT, tightViewport);
      
      // Should still prevent overlap even if exceeding viewport
      const minSpacing = calculateMinimumSpacingForPlanets(planets);
      expect(spacing).toBeGreaterThanOrEqual(minSpacing - FLOATING_POINT_TOLERANCE);
    });

    it('should apply density factor for many planets', () => {
      // Just below threshold
      const fewerPlanets: PlanetSizeInfo[] = Array.from({ length: 7 }, (_, i) => ({
        index: i,
        radius: 0.8,
      }));
      
      // Above threshold
      const manyPlanets: PlanetSizeInfo[] = Array.from({ length: 12 }, (_, i) => ({
        index: i,
        radius: 0.8,
      }));
      
      const fewerSpacing = calculateDynamicSpacing(fewerPlanets);
      const manySpacing = calculateDynamicSpacing(manyPlanets);
      
      // Spacing should increase for more planets
      expect(manySpacing).toBeGreaterThan(fewerSpacing);
    });

    it('should handle edge case of extremely large planet', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.8 },
        { index: 1, radius: 5.0 },  // Very large planet
        { index: 2, radius: 0.8 },
      ];
      
      const spacing = calculateDynamicSpacing(planets);
      
      // Check the large planet doesn't overlap with neighbors
      const orbit1 = ORBITAL_SPACING.BASE_RADIUS + 1 * spacing;
      const orbit2 = ORBITAL_SPACING.BASE_RADIUS + 2 * spacing;
      const gap = orbit2 - orbit1;
      const minGap = planets[1].radius + planets[2].radius + ORBITAL_SPACING.MIN_SEPARATION;
      
      expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
    });

    it('should handle non-sequential indices gracefully', () => {
      // Simulating legacy data with gaps
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 1.0 },
        { index: 2, radius: 1.0 },  // Gap at index 1
        { index: 3, radius: 1.0 },
      ];
      
      const spacing = calculateDynamicSpacing(planets);
      
      // Should still calculate without errors
      expect(spacing).toBeGreaterThan(0);
      expect(Number.isFinite(spacing)).toBe(true);
    });
  });

  describe('calculateMinimumSpacingForPlanets', () => {
    it('should return base spacing for single planet', () => {
      const planets: PlanetSizeInfo[] = [{ index: 0, radius: 0.8 }];
      const minSpacing = calculateMinimumSpacingForPlanets(planets);
      expect(minSpacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should calculate minimum for uniform planets', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 1.0 },
        { index: 1, radius: 1.0 },
      ];
      
      const minSpacing = calculateMinimumSpacingForPlanets(planets);
      
      // Minimum gap = 1.0 + 1.0 + MIN_SEPARATION = 2.0 + 2.0 = 4.0
      // For index difference of 1, spacing should be >= 4.0
      expect(minSpacing).toBeGreaterThanOrEqual(4.0 - FLOATING_POINT_TOLERANCE);
    });

    it('should handle large planet correctly', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.8 },
        { index: 1, radius: 3.0 },  // Very large
        { index: 2, radius: 0.8 },
      ];
      
      const minSpacing = calculateMinimumSpacingForPlanets(planets);
      
      // Worst case pair: indices 1 and 2, radii 3.0 + 0.8 + 2.0 = 5.8
      expect(minSpacing).toBeGreaterThanOrEqual(5.8 - FLOATING_POINT_TOLERANCE);
    });

    it('should find maximum required spacing across all pairs', () => {
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.5 },  // Small
        { index: 1, radius: 1.5 },  // Medium
        { index: 2, radius: 2.0 },  // Large
        { index: 3, radius: 0.8 },  // Small
      ];
      
      const minSpacing = calculateMinimumSpacingForPlanets(planets);
      
      // Check that this spacing prevents all overlaps
      for (let i = 0; i < planets.length - 1; i++) {
        const gap = minSpacing * (planets[i + 1].index - planets[i].index);
        const minGap = planets[i].radius + planets[i + 1].radius + ORBITAL_SPACING.MIN_SEPARATION;
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
      }
    });
  });

  describe('calculateDynamicOrbitalRadius', () => {
    it('should calculate radius with dynamic spacing', () => {
      const spacing = 4.5;
      const radius = calculateDynamicOrbitalRadius(2, spacing);
      
      expect(radius).toBe(ORBITAL_SPACING.BASE_RADIUS + 2 * spacing);
      expect(radius).toBe(4.0 + 9.0);
      expect(radius).toBe(13.0);
    });

    it('should return base radius for first planet', () => {
      const spacing = 3.0;
      const radius = calculateDynamicOrbitalRadius(0, spacing);
      
      expect(radius).toBe(ORBITAL_SPACING.BASE_RADIUS);
    });

    it('should increase linearly with index', () => {
      const spacing = 5.0;
      const radius0 = calculateDynamicOrbitalRadius(0, spacing);
      const radius1 = calculateDynamicOrbitalRadius(1, spacing);
      const radius2 = calculateDynamicOrbitalRadius(2, spacing);
      
      expect(radius1 - radius0).toBe(spacing);
      expect(radius2 - radius1).toBe(spacing);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for dense system (15 planets)', () => {
      // Simulate a dense system with varying planet sizes
      const planets: PlanetSizeInfo[] = Array.from({ length: 15 }, (_, i) => ({
        index: i,
        radius: 0.8 + (i % 4) * 0.2, // Varies from 0.8 to 1.4
      }));
      
      const spacing = calculateDynamicSpacing(planets);
      
      // Calculate all orbital radii
      const orbits = planets.map(p => calculateDynamicOrbitalRadius(p.index, spacing));
      
      // Verify no overlaps
      for (let i = 0; i < planets.length - 1; i++) {
        const gap = orbits[i + 1] - orbits[i];
        const minGap = planets[i].radius + planets[i + 1].radius + ORBITAL_SPACING.MIN_SEPARATION;
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
      }
      
      // Verify all planets have valid positions
      orbits.forEach(orbit => {
        expect(Number.isFinite(orbit)).toBe(true);
        expect(orbit).toBeGreaterThan(0);
      });
    });

    it('should maintain performance with many planets', () => {
      const planets: PlanetSizeInfo[] = Array.from({ length: 50 }, (_, i) => ({
        index: i,
        radius: 0.8 + Math.random() * 0.5,
      }));
      
      const startTime = performance.now();
      const spacing = calculateDynamicSpacing(planets);
      const endTime = performance.now();
      
      // Should complete in reasonable time (< 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      
      // Should return valid spacing
      expect(Number.isFinite(spacing)).toBe(true);
      expect(spacing).toBeGreaterThan(0);
    });

    it('should handle realistic solar system (8 planets) with appropriate spacing', () => {
      // Simulating our solar system with varied sizes
      const planets: PlanetSizeInfo[] = [
        { index: 0, radius: 0.8 },  // Mercury (small)
        { index: 1, radius: 0.9 },  // Venus
        { index: 2, radius: 1.0 },  // Earth
        { index: 3, radius: 0.85 }, // Mars
        { index: 4, radius: 1.8 },  // Jupiter (largest)
        { index: 5, radius: 1.6 },  // Saturn
        { index: 6, radius: 1.3 },  // Uranus
        { index: 7, radius: 1.2 },  // Neptune
      ];
      
      // Don't pass viewport constraint - let it use natural spacing
      const spacing = calculateDynamicSpacing(planets, ORBITAL_SPACING.RADIUS_INCREMENT);
      
      // Verify no overlaps
      for (let i = 0; i < planets.length - 1; i++) {
        const orbitI = ORBITAL_SPACING.BASE_RADIUS + i * spacing;
        const orbitNext = ORBITAL_SPACING.BASE_RADIUS + (i + 1) * spacing;
        const gap = orbitNext - orbitI;
        const minGap = planets[i].radius + planets[i + 1].radius + ORBITAL_SPACING.MIN_SEPARATION;
        
        expect(gap).toBeGreaterThanOrEqual(minGap - FLOATING_POINT_TOLERANCE);
      }
      
      // Verify all orbits are positive and finite
      const allOrbits = planets.map((p, i) => ORBITAL_SPACING.BASE_RADIUS + i * spacing);
      allOrbits.forEach(orbit => {
        expect(Number.isFinite(orbit)).toBe(true);
        expect(orbit).toBeGreaterThan(0);
      });
    });
  });
});
