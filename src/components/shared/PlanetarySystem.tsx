'use client';

/**
 * PlanetarySystem - Shared component for rendering a star with orbiting planets
 * Used by both GalaxyView (miniature solar systems) and SolarSystemView (full system)
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SolarSystem, Planet } from '@/lib/universe/types';
import { OrbitRing } from '../OrbitRing';
import { OrbitingPlanet } from './OrbitingPlanet';
import { CentralStar } from './CentralStar';
import { createSeededRandom, generateSeedFromId } from '@/lib/seeded-random';
import type { getAnimationConfig } from '@/lib/animation';
import { calculateDynamicSpacing, calculateDynamicOrbitalRadius, type PlanetSizeInfo } from '@/lib/universe/scale-constants';
import { clampAnimationMultiplier } from '@/lib/graphics';
import { useGraphicsConfigReadOnly } from '@/lib/graphics-context';

// Kepler's third law approximation factor
// orbital_speed = KEPLER_ORBITAL_SPEED_FACTOR / (semiMajorAxis^2)
// This gives inner planets faster orbital speeds than outer planets
const KEPLER_ORBITAL_SPEED_FACTOR = 0.5;

interface PlanetarySystemProps {
  solarSystem: SolarSystem;
  position: THREE.Vector3;
  // Callbacks
  onStarClick?: () => void;
  onPlanetClick?: (planet: Planet) => void;
  // Scale configuration
  scale: {
    // Star properties
    starRadius: number;
    starLightIntensity: number;
    starLightDistance: number;
    // Orbit properties
    orbitBaseRadius: number;      // Starting radius for first planet
    orbitSpacing: number;          // Spacing between orbits
    orbitEccentricity: number;     // Max eccentricity (0 = circle)
    orbitInclination: number;      // Max inclination in radians
    // Planet properties
    planetBaseSize: number;        // Base size for planets
    planetSizeIncrement: number;   // Size increase per moon
    // Viewport constraints
    viewportRadius?: number;       // Optional viewport radius constraint
    // Orbit ring styling
    orbitRingColor: string;
    orbitRingOpacity: number;
    orbitRingLineWidth: number;
    orbitRingDashPattern?: readonly [number, number] | [number, number];
    orbitRingSegments: number;
  };
  // Animation configuration
  animationConfig?: ReturnType<typeof getAnimationConfig>;
}

/**
 * PlanetarySystem component
 * Renders a complete planetary system with a central star and orbiting planets
 */
export function PlanetarySystem({
  solarSystem,
  position,
  onStarClick,
  onPlanetClick,
  scale,
  animationConfig,
}: PlanetarySystemProps) {
  // Get graphics config for orbit animation speed
  const graphicsConfig = useGraphicsConfigReadOnly();
  
  // Calculate planet sizes and optimal spacing
  const { spacing, planetData } = useMemo(() => {
    const planets = solarSystem.planets || [];
    
    // Get orbital animation speed from graphics config
    const orbitSpeedMultiplier = clampAnimationMultiplier(
      graphicsConfig.solarSystemView.orbitAnimationSpeed,
      1.0
    );
    
    // First pass: calculate planet sizes
    const planetSizes: PlanetSizeInfo[] = planets.map((planet, index) => ({
      index,
      radius: scale.planetBaseSize + (planet.moons?.length || 0) * scale.planetSizeIncrement,
    }));
    
    // Calculate optimal spacing considering planet sizes
    // viewportRadius is now properly typed in the scale interface
    const optimalSpacing = calculateDynamicSpacing(
      planetSizes,
      scale.orbitSpacing,
      scale.viewportRadius
    );
    
    // Second pass: calculate orbital parameters with optimal spacing
    const data = planets.map((planet, index) => {
      // Create a unique seed for each planet for deterministic randomness
      const seed = generateSeedFromId(solarSystem.id, index);
      const seededRandom = createSeededRandom(seed);

      // Keplerian orbit parameters with dynamic spacing
      // Uses pre-calculated optimal spacing instead of fixed scale.orbitSpacing
      // to prevent planet overlap and respect viewport constraints
      const semiMajorAxis = calculateDynamicOrbitalRadius(index, optimalSpacing);
      const eccentricity = seededRandom() * scale.orbitEccentricity;
      const inclination = (seededRandom() - 0.5) * scale.orbitInclination;
      const argumentOfPeriapsis = seededRandom() * Math.PI * 2;
      // Apply config-driven orbital speed multiplier
      const orbitSpeed = (KEPLER_ORBITAL_SPEED_FACTOR / (semiMajorAxis * semiMajorAxis)) * orbitSpeedMultiplier;

      // Planet visual properties
      const size = planetSizes[index].radius;

      return {
        planet,
        semiMajorAxis,
        eccentricity,
        inclination,
        argumentOfPeriapsis,
        orbitSpeed,
        phase: seededRandom() * Math.PI * 2, // Random but deterministic starting position
        size,
      };
    });
    
    return { spacing: optimalSpacing, planetData: data };
  }, [solarSystem, scale, graphicsConfig.solarSystemView.orbitAnimationSpeed]);

  return (
    <group position={position}>
      {/* Central star */}
      <CentralStar
        solarSystem={solarSystem}
        position={new THREE.Vector3(0, 0, 0)}
        onClick={onStarClick}
        radius={scale.starRadius}
        lightIntensity={scale.starLightIntensity}
        lightDistance={scale.starLightDistance}
        animationConfig={animationConfig}
        enablePulse={false} // No pulse for solar system stars
      />

      {/* Orbit rings */}
      {planetData.map((data, index) => (
        <OrbitRing
          key={`orbit-${index}`}
          radius={data.semiMajorAxis}
          color={scale.orbitRingColor}
          opacity={scale.orbitRingOpacity}
          lineWidth={scale.orbitRingLineWidth}
          dashPattern={scale.orbitRingDashPattern}
          segments={scale.orbitRingSegments}
        />
      ))}

      {/* Orbiting planets */}
      {planetData.map((data, index) => (
        <OrbitingPlanet
          key={`planet-${data.planet.id}`}
          planet={data.planet}
          index={index}
          onClick={() => onPlanetClick?.(data.planet)}
          semiMajorAxis={data.semiMajorAxis}
          eccentricity={data.eccentricity}
          inclination={data.inclination}
          argumentOfPeriapsis={data.argumentOfPeriapsis}
          orbitSpeed={data.orbitSpeed}
          phase={data.phase}
          size={data.size}
        />
      ))}
    </group>
  );
}
