'use client';

/**
 * OrbitingPlanet - Shared component for rendering a planet in Keplerian orbit
 * Used by both GalaxyView and SolarSystemView with different scale parameters
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Planet } from '@/lib/universe/types';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import {
  DEFAULT_GRAPHICS_CONFIG,
  getPlanetMaterialPreset,
  detectDeviceCapabilities,
  applyPlanetMaterial,
  mapThemeToMaterialPreset,
  clonePlanetMaterial,
} from '@/lib/graphics';

interface OrbitingPlanetProps {
  planet: Planet;
  index: number;
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

/**
 * OrbitingPlanet component
 * Renders a single planet following Keplerian orbital mechanics
 * Note: Orbital speed is calculated by parent PlanetarySystem component using
 * KEPLER_ORBITAL_SPEED_FACTOR constant defined there.
 */
export function OrbitingPlanet({
  planet,
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
  const [atmosphereShell, setAtmosphereShell] = useState<THREE.Mesh | null>(null);

  // Detect device capabilities for material optimization
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);

  // Get graphics configuration
  const graphicsConfig = useMemo(() => DEFAULT_GRAPHICS_CONFIG, []);
  const planetViewConfig = graphicsConfig.planetView;

  // Get material preset based on planet theme
  const materialPreset = useMemo(() => {
    const presetId = mapThemeToMaterialPreset(planet.theme);
    const preset = getPlanetMaterialPreset(presetId);
    // Clone to prevent reference mutation across multiple planets
    return preset ? clonePlanetMaterial(preset) : null;
  }, [planet.theme]);

  // Apply material to planet mesh
  useEffect(() => {
    if (meshRef.current && materialPreset) {
      const mesh = meshRef.current; // Capture ref for cleanup
      const { material, atmosphereShell: newAtmosphere } = applyPlanetMaterial(
        mesh,
        materialPreset,
        planetViewConfig,
        capabilities,
        graphicsConfig.universe.lowPowerMode
      );

      // Add atmosphere shell if created
      if (newAtmosphere && mesh) {
        mesh.add(newAtmosphere);
        setAtmosphereShell(newAtmosphere);
      }

      // Cleanup previous atmosphere on unmount
      return () => {
        if (newAtmosphere && mesh) {
          mesh.remove(newAtmosphere);
        }
      };
    }
  }, [materialPreset, planetViewConfig, capabilities, graphicsConfig.universe.lowPowerMode]);

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

    // Position in 3D space with orbital inclination relative to parent group
    // Parent PlanetarySystem wraps this in a group with position, so coordinates are relative
    // X: Horizontal position in the orbital plane
    // Y: Vertical displacement due to orbital inclination
    // Z: Depth displacement, combining orbital position and inclination
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.y = Math.sin(angle) * radius * Math.sin(inclination);
    meshRef.current.position.z = Math.sin(angle) * radius * Math.cos(inclination);
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

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[size, 16, 16]} />
      {/* Material is applied dynamically via applyPlanetMaterial */}
    </mesh>
  );
}
