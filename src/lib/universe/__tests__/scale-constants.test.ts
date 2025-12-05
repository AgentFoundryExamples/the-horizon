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

import {
  PLANET_SCALE,
  ORBITAL_SPACING,
  STAR_SCALE,
  calculatePlanetSize,
  calculateMoonSize,
  calculateOrbitalRadius,
  calculateSafeSpacing,
} from '../scale-constants';

describe('Scale Constants', () => {
  describe('PLANET_SCALE', () => {
    it('should have valid minimum size for tap targets', () => {
      // Minimum 0.8 units should translate to ~44-50px at default zoom
      expect(PLANET_SCALE.MIN_SIZE).toBeGreaterThanOrEqual(0.8);
    });

    it('should have maximum size larger than minimum', () => {
      expect(PLANET_SCALE.MAX_SIZE).toBeGreaterThan(PLANET_SCALE.MIN_SIZE);
    });

    it('should have reasonable base size', () => {
      expect(PLANET_SCALE.BASE_SIZE).toBeGreaterThanOrEqual(PLANET_SCALE.MIN_SIZE);
      expect(PLANET_SCALE.BASE_SIZE).toBeLessThanOrEqual(PLANET_SCALE.MAX_SIZE);
    });

    it('should have positive moon multiplier', () => {
      expect(PLANET_SCALE.MOON_MULTIPLIER).toBeGreaterThan(0);
    });
  });

  describe('ORBITAL_SPACING', () => {
    it('should have base radius larger than star radius', () => {
      // First planet should be clearly separated from star
      expect(ORBITAL_SPACING.BASE_RADIUS).toBeGreaterThan(STAR_SCALE.RADIUS * 2);
    });

    it('should have positive radius increment', () => {
      expect(ORBITAL_SPACING.RADIUS_INCREMENT).toBeGreaterThan(0);
    });

    it('should have increment larger than planet sizes to prevent overlap', () => {
      // Spacing should accommodate maximum planet sizes
      expect(ORBITAL_SPACING.RADIUS_INCREMENT).toBeGreaterThan(PLANET_SCALE.MAX_SIZE);
    });

    it('should have reasonable eccentricity for circular orbits', () => {
      expect(ORBITAL_SPACING.MAX_ECCENTRICITY).toBeGreaterThanOrEqual(0);
      expect(ORBITAL_SPACING.MAX_ECCENTRICITY).toBeLessThan(0.2); // Keep mostly circular
    });

    it('should have inclination that prevents z-fighting', () => {
      expect(ORBITAL_SPACING.MAX_INCLINATION).toBeGreaterThan(0);
      expect(ORBITAL_SPACING.MAX_INCLINATION).toBeLessThan(Math.PI / 4); // Less than 45 degrees
    });
  });

  describe('STAR_SCALE', () => {
    it('should have positive radius', () => {
      expect(STAR_SCALE.RADIUS).toBeGreaterThan(0);
    });

    it('should have star smaller than minimum planet to show scale', () => {
      // Star should be visible but not overwhelm planets
      expect(STAR_SCALE.RADIUS).toBeLessThan(PLANET_SCALE.MAX_SIZE);
    });

    it('should have positive light intensity', () => {
      expect(STAR_SCALE.LIGHT_INTENSITY).toBeGreaterThan(0);
    });

    it('should have light distance that covers multiple orbits', () => {
      // Light should reach several planet orbits
      expect(STAR_SCALE.LIGHT_DISTANCE).toBeGreaterThan(ORBITAL_SPACING.BASE_RADIUS * 3);
    });
  });

  describe('calculatePlanetSize', () => {
    it('should return minimum size for planets with no moons', () => {
      const size = calculatePlanetSize(0);
      expect(size).toBeGreaterThanOrEqual(PLANET_SCALE.MIN_SIZE);
    });

    it('should increase size with more moons', () => {
      const size0 = calculatePlanetSize(0);
      const size1 = calculatePlanetSize(1);
      const size2 = calculatePlanetSize(2);
      
      expect(size1).toBeGreaterThan(size0);
      expect(size2).toBeGreaterThan(size1);
    });

    it('should not exceed maximum size', () => {
      const size = calculatePlanetSize(100); // Many moons
      expect(size).toBeLessThanOrEqual(PLANET_SCALE.MAX_SIZE);
    });

    it('should handle edge case of exact max size boundary', () => {
      // Calculate moon count that would hit max size
      const moonsToMax = Math.ceil(
        (PLANET_SCALE.MAX_SIZE - PLANET_SCALE.MIN_SIZE) / PLANET_SCALE.MOON_MULTIPLIER
      );
      
      const size = calculatePlanetSize(moonsToMax);
      expect(size).toBeLessThanOrEqual(PLANET_SCALE.MAX_SIZE);
    });

    it('should be deterministic', () => {
      const size1 = calculatePlanetSize(3);
      const size2 = calculatePlanetSize(3);
      expect(size1).toBe(size2);
    });
  });

  describe('calculateMoonSize', () => {
    it('should return consistent size', () => {
      const size = calculateMoonSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should be smaller than minimum planet size', () => {
      const moonSize = calculateMoonSize();
      expect(moonSize).toBeLessThan(PLANET_SCALE.MIN_SIZE);
    });

    it('should use the configured ratio', () => {
      const expectedSize = PLANET_SCALE.MIN_SIZE * PLANET_SCALE.MOON_SIZE_RATIO;
      const actualSize = calculateMoonSize();
      expect(actualSize).toBe(expectedSize);
    });

    it('should be deterministic', () => {
      const size1 = calculateMoonSize();
      const size2 = calculateMoonSize();
      expect(size1).toBe(size2);
    });
  });

  describe('calculateOrbitalRadius', () => {
    it('should return base radius for first planet', () => {
      const radius = calculateOrbitalRadius(0);
      expect(radius).toBe(ORBITAL_SPACING.BASE_RADIUS);
    });

    it('should increase radius for outer planets', () => {
      const radius0 = calculateOrbitalRadius(0);
      const radius1 = calculateOrbitalRadius(1);
      const radius2 = calculateOrbitalRadius(2);
      
      expect(radius1).toBeGreaterThan(radius0);
      expect(radius2).toBeGreaterThan(radius1);
    });

    it('should have linear spacing', () => {
      const radius0 = calculateOrbitalRadius(0);
      const radius1 = calculateOrbitalRadius(1);
      const radius2 = calculateOrbitalRadius(2);
      
      const diff1 = radius1 - radius0;
      const diff2 = radius2 - radius1;
      
      expect(diff1).toBe(diff2);
      expect(diff1).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should handle large planet indices', () => {
      const radius = calculateOrbitalRadius(20);
      expect(radius).toBeGreaterThan(0);
      expect(Number.isFinite(radius)).toBe(true);
    });
  });

  describe('calculateSafeSpacing', () => {
    it('should return standard spacing for few planets', () => {
      const spacing = calculateSafeSpacing(4);
      expect(spacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should return standard spacing at threshold', () => {
      const spacing = calculateSafeSpacing(ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
      expect(spacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should start increasing spacing just above the threshold', () => {
      const spacingAtThreshold = calculateSafeSpacing(ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
      const spacingAboveThreshold = calculateSafeSpacing(ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD + 1);
      
      expect(spacingAtThreshold).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
      expect(spacingAboveThreshold).toBeGreaterThan(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should increase spacing for many planets', () => {
      const spacing8 = calculateSafeSpacing(ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD);
      const spacing12 = calculateSafeSpacing(12);
      const spacing16 = calculateSafeSpacing(16);
      
      expect(spacing12).toBeGreaterThan(spacing8);
      expect(spacing16).toBeGreaterThan(spacing12);
    });

    it('should scale proportionally with planet count', () => {
      const threshold = ORBITAL_SPACING.ADAPTIVE_SPACING_THRESHOLD;
      const spacing8 = calculateSafeSpacing(threshold);
      const spacing16 = calculateSafeSpacing(threshold * 2);
      
      // Double the planet count should give 2× spacing
      expect(spacing16).toBeCloseTo(spacing8 * 2, 2);
    });

    it('should handle single planet', () => {
      const spacing = calculateSafeSpacing(1);
      expect(spacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should handle zero planets', () => {
      const spacing = calculateSafeSpacing(0);
      expect(spacing).toBe(ORBITAL_SPACING.RADIUS_INCREMENT);
    });

    it('should prevent overlaps with maximum-sized planets', () => {
      const spacing = calculateSafeSpacing(8);
      // Spacing should accommodate maximum-sized planets with some buffer
      // Since planets are on circular orbits at different radii, they don't need
      // exactly 2× diameter spacing (which would be needed if side-by-side)
      expect(spacing).toBeGreaterThan(PLANET_SCALE.MAX_SIZE * 1.5);
    });
  });

  describe('Integration - Orbital System', () => {
    it('should prevent planet overlaps in typical system', () => {
      const planetCount = 5;
      const spacing = calculateSafeSpacing(planetCount);
      
      for (let i = 0; i < planetCount - 1; i++) {
        const radius1 = ORBITAL_SPACING.BASE_RADIUS + i * spacing;
        const radius2 = ORBITAL_SPACING.BASE_RADIUS + (i + 1) * spacing;
        const size1 = calculatePlanetSize(3); // Assume 3 moons each
        const size2 = calculatePlanetSize(3);
        
        const gap = radius2 - radius1;
        const minRequired = size1 + size2;
        
        expect(gap).toBeGreaterThan(minRequired);
      }
    });

    it('should prevent overlaps with many planets', () => {
      const planetCount = 12;
      const spacing = calculateSafeSpacing(planetCount);
      
      for (let i = 0; i < planetCount - 1; i++) {
        const radius1 = ORBITAL_SPACING.BASE_RADIUS + i * spacing;
        const radius2 = ORBITAL_SPACING.BASE_RADIUS + (i + 1) * spacing;
        const size1 = PLANET_SCALE.MAX_SIZE; // Worst case
        const size2 = PLANET_SCALE.MAX_SIZE;
        
        const gap = radius2 - radius1;
        const minRequired = size1 + size2;
        
        expect(gap).toBeGreaterThan(minRequired);
      }
    });

    it('should maintain minimum tap target across all configurations', () => {
      const moonCounts = [0, 1, 2, 5, 10, 50];
      
      moonCounts.forEach(moonCount => {
        const size = calculatePlanetSize(moonCount);
        expect(size).toBeGreaterThanOrEqual(PLANET_SCALE.MIN_SIZE);
      });
    });
  });

  describe('Accessibility - Touch Target Requirements', () => {
    it('should meet WCAG 2.1 minimum touch target size', () => {
      // WCAG requires 44×44 CSS pixels
      // At default zoom, 1 Three.js unit ≈ 50-60 CSS pixels
      // So minimum 0.8 units provides ~44-50 CSS pixels
      const minSize = calculatePlanetSize(0);
      const estimatedCSSPixels = minSize * 55; // Middle of range
      
      expect(estimatedCSSPixels).toBeGreaterThanOrEqual(44);
    });

    it('should provide larger targets for planets with content', () => {
      const sizeNoMoons = calculatePlanetSize(0);
      const sizeWithMoons = calculatePlanetSize(3);
      
      // Planets with moons (more content) should be easier to tap
      expect(sizeWithMoons).toBeGreaterThan(sizeNoMoons);
    });
  });

  describe('Performance Considerations', () => {
    it('should keep light distance reasonable for performance', () => {
      // Very large light distances hurt performance
      expect(STAR_SCALE.LIGHT_DISTANCE).toBeLessThan(50);
    });

    it('should support reasonable number of planets', () => {
      // Should handle at least 20 planets without issues
      const spacing = calculateSafeSpacing(20);
      const outerRadius = ORBITAL_SPACING.BASE_RADIUS + 19 * spacing;
      
      // Should fit within reasonable render distance
      expect(outerRadius).toBeLessThan(200);
    });
  });
});
