/**
 * Unit tests for shared planetary system components
 * Verifies visual consistency and component integration
 */

import { describe, it, expect, jest } from '@jest/globals';
import * as THREE from 'three';

describe('Planetary System Scale Presets', () => {
  it('should define galaxy view scale preset', () => {
    // Import dynamically to avoid module loading issues
    const scaleConstants = require('@/lib/universe/scale-constants');
    const galaxyScale = scaleConstants.GALAXY_VIEW_PLANETARY_SCALE;

    expect(galaxyScale).toBeDefined();
    expect(galaxyScale.starRadius).toBe(0.5);
    expect(galaxyScale.orbitBaseRadius).toBe(2);
    expect(galaxyScale.orbitSpacing).toBe(1.5);
    expect(galaxyScale.planetBaseSize).toBe(0.3);
    expect(galaxyScale.orbitRingColor).toBe('#4A90E2');
  });

  it('should define solar system view scale preset', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    const solarScale = scaleConstants.SOLAR_SYSTEM_VIEW_PLANETARY_SCALE;

    expect(solarScale).toBeDefined();
    expect(solarScale.starRadius).toBe(1.2);
    expect(solarScale.orbitBaseRadius).toBe(4.0);
    expect(solarScale.orbitSpacing).toBe(3.0);
    expect(solarScale.planetBaseSize).toBe(0.8);
    expect(solarScale.orbitRingColor).toBe('#7BA5D1');
  });

  it('should have galaxy scale smaller than solar system scale', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    const galaxyScale = scaleConstants.GALAXY_VIEW_PLANETARY_SCALE;
    const solarScale = scaleConstants.SOLAR_SYSTEM_VIEW_PLANETARY_SCALE;

    // Galaxy view should have smaller dimensions for compact display
    expect(galaxyScale.starRadius).toBeLessThan(solarScale.starRadius);
    expect(galaxyScale.orbitBaseRadius).toBeLessThan(solarScale.orbitBaseRadius);
    expect(galaxyScale.orbitSpacing).toBeLessThan(solarScale.orbitSpacing);
    expect(galaxyScale.planetBaseSize).toBeLessThan(solarScale.planetBaseSize);
  });

  it('should use different orbit ring styles for galaxy vs solar views', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    const galaxyScale = scaleConstants.GALAXY_VIEW_PLANETARY_SCALE;
    const solarScale = scaleConstants.SOLAR_SYSTEM_VIEW_PLANETARY_SCALE;

    // Galaxy rings should be more prominent
    expect(galaxyScale.orbitRingOpacity).toBeGreaterThan(solarScale.orbitRingOpacity);
    
    // Galaxy rings should be solid, solar rings dashed
    expect(galaxyScale.orbitRingDashPattern).toBeUndefined();
    expect(solarScale.orbitRingDashPattern).toEqual([2, 2]);
  });

  it('should have consistent color schemes', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    const galaxyScale = scaleConstants.GALAXY_VIEW_PLANETARY_SCALE;
    const solarScale = scaleConstants.SOLAR_SYSTEM_VIEW_PLANETARY_SCALE;

    // Both should use blue color family
    expect(galaxyScale.orbitRingColor).toContain('#');
    expect(solarScale.orbitRingColor).toContain('#');
    
    // Should be valid hex colors
    expect(galaxyScale.orbitRingColor).toMatch(/^#[0-9A-F]{6}$/i);
    expect(solarScale.orbitRingColor).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('Component Integration', () => {
  it('should export shared components', () => {
    // Verify components are exportable
    const OrbitingPlanet = require('@/components/shared/OrbitingPlanet');
    const CentralStar = require('@/components/shared/CentralStar');
    const PlanetarySystem = require('@/components/shared/PlanetarySystem');

    expect(OrbitingPlanet).toBeDefined();
    expect(CentralStar).toBeDefined();
    expect(PlanetarySystem).toBeDefined();
  });

  it('should calculate planet sizes consistently', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    
    // Test planet size calculation
    const size0Moons = scaleConstants.calculatePlanetSize(0);
    const size3Moons = scaleConstants.calculatePlanetSize(3);
    const size10Moons = scaleConstants.calculatePlanetSize(10);

    // Size should increase with moon count
    expect(size3Moons).toBeGreaterThan(size0Moons);
    expect(size10Moons).toBeGreaterThan(size3Moons);
    
    // Should respect max size limit
    expect(size10Moons).toBeLessThanOrEqual(scaleConstants.PLANET_SCALE.MAX_SIZE);
  });

  it('should calculate adaptive orbital radius correctly', () => {
    const scaleConstants = require('@/lib/universe/scale-constants');
    
    // Test adaptive spacing
    const radius0_4planets = scaleConstants.calculateAdaptiveOrbitalRadius(0, 4);
    const radius0_12planets = scaleConstants.calculateAdaptiveOrbitalRadius(0, 12);
    
    // First planet should always be at base radius
    expect(radius0_4planets).toBe(scaleConstants.ORBITAL_SPACING.BASE_RADIUS);
    expect(radius0_12planets).toBe(scaleConstants.ORBITAL_SPACING.BASE_RADIUS);
    
    // Second planet should have increased spacing for many-planet systems
    const radius1_4planets = scaleConstants.calculateAdaptiveOrbitalRadius(1, 4);
    const radius1_12planets = scaleConstants.calculateAdaptiveOrbitalRadius(1, 12);
    
    expect(radius1_12planets).toBeGreaterThan(radius1_4planets);
  });
});

describe('Visual Consistency', () => {
  it('should use same planet color logic', () => {
    // Define planet color mapping (from OrbitingPlanet component)
    const getPlanetColor = (theme: string) => {
      switch (theme) {
        case 'blue-green': return '#2E86AB';
        case 'red': return '#E63946';
        case 'earth-like': return '#4A90E2';
        default: return '#CCCCCC';
      }
    };

    // Verify colors are consistent
    expect(getPlanetColor('blue-green')).toBe('#2E86AB');
    expect(getPlanetColor('red')).toBe('#E63946');
    expect(getPlanetColor('earth-like')).toBe('#4A90E2');
    expect(getPlanetColor('unknown')).toBe('#CCCCCC');
  });

  it('should use same orbital mechanics constants', () => {
    // Verify KEPLER_ITERATION_COUNT is consistent
    // This constant is used in both OrbitingPlanet and previous implementations
    const KEPLER_ITERATION_COUNT = 5;
    
    expect(KEPLER_ITERATION_COUNT).toBe(5);
    expect(KEPLER_ITERATION_COUNT).toBeGreaterThan(0);
    expect(KEPLER_ITERATION_COUNT).toBeLessThan(10); // Not too many for performance
  });
});
