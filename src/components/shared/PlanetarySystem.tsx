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
  // Calculate planet orbital parameters
  const planetData = useMemo(() => {
    return (solarSystem.planets || []).map((planet, index) => {
      // Create a unique seed for each planet for deterministic randomness
      const seed = generateSeedFromId(solarSystem.id, index);
      const seededRandom = createSeededRandom(seed);

      // Keplerian orbit parameters
      const semiMajorAxis = scale.orbitBaseRadius + index * scale.orbitSpacing;
      const eccentricity = seededRandom() * scale.orbitEccentricity;
      const inclination = (seededRandom() - 0.5) * scale.orbitInclination;
      const argumentOfPeriapsis = seededRandom() * Math.PI * 2;
      const orbitSpeed = 0.5 / (semiMajorAxis * semiMajorAxis); // Kepler's third law approximation

      // Planet visual properties
      const size = scale.planetBaseSize + (planet.moons?.length || 0) * scale.planetSizeIncrement;

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
  }, [solarSystem, scale]);

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
          systemPosition={position}
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
