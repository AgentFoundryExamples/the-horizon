'use client';

/**
 * OrbitingPlanet - Shared component for rendering a planet in Keplerian orbit
 * Used by both GalaxyView and SolarSystemView with different scale parameters
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Planet } from '@/lib/universe/types';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';

interface OrbitingPlanetProps {
  planet: Planet;
  index: number;
  systemPosition: THREE.Vector3;
  onClick?: () => void;
  onHover?: (hoveredObj: HoveredObject | null) => void;
  // Orbital parameters
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  argumentOfPeriapsis: number;
  orbitSpeed: number;
  phase: number;
  // Visual parameters
  size: number;
}

// Constants for orbital calculations
// 5 iterations provides sufficient accuracy for the eccentric anomaly approximation
// while maintaining 60 FPS performance. More iterations yield diminishing returns.
const KEPLER_ITERATION_COUNT = 5;

// Kepler's third law approximation factor
// orbital_speed = KEPLER_ORBITAL_SPEED_FACTOR / (semiMajorAxis^2)
// This gives inner planets faster orbital speeds than outer planets
const KEPLER_ORBITAL_SPEED_FACTOR = 0.5;

/**
 * OrbitingPlanet component
 * Renders a single planet following Keplerian orbital mechanics
 */
export function OrbitingPlanet({
  planet,
  systemPosition,
  onClick,
  onHover,
  semiMajorAxis,
  eccentricity,
  inclination,
  argumentOfPeriapsis,
  orbitSpeed,
  phase,
  size,
}: OrbitingPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const meanAnomaly = orbitSpeed * time + phase;

    // Simplified Keplerian orbit calculation
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < KEPLER_ITERATION_COUNT; i++) {
      eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
    }

    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

    const radius =
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(trueAnomaly));

    const angle = trueAnomaly + argumentOfPeriapsis;

    // Position in 3D space with orbital inclination
    // X-Y plane is the reference orbit plane, inclination tilts the orbit
    // X: Horizontal position in the orbital plane
    // Y: Vertical displacement due to orbital inclination
    // Z: Depth displacement, combining orbital position and inclination
    meshRef.current.position.x = systemPosition.x + Math.cos(angle) * radius;
    meshRef.current.position.y = systemPosition.y + Math.sin(angle) * radius * Math.sin(inclination);
    meshRef.current.position.z = systemPosition.z + Math.sin(angle) * radius * Math.cos(inclination);
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (meshRef.current) {
      // Get world position of the mesh for accurate hover tracking
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);

      const hoveredObj: HoveredObject = {
        id: planet.id,
        name: planet.name,
        type: 'planet',
        position: worldPosition,
        metadata: {
          description: planet.summary,
          moonCount: planet.moons?.length || 0,
          theme: planet.theme,
        },
      };

      if (onHover) {
        onHover(hoveredObj);
      }
      setHoveredObject(hoveredObj);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    if (onHover) {
      onHover(null);
    }
    setHoveredObject(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  // Determine color based on theme
  const color = useMemo(() => {
    switch (planet.theme) {
      case 'blue-green':
        return '#2E86AB';
      case 'red':
        return '#E63946';
      case 'earth-like':
        return '#4A90E2';
      default:
        return '#CCCCCC';
    }
  }, [planet.theme]);

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
