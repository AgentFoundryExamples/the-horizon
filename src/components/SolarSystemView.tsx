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

'use client';

/**
 * SolarSystemView - Displays a solar system with clickable planets
 * Extends the existing GalaxyView with planet interaction
 */

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SolarSystem, Planet } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import {
  calculatePlanetSize,
  calculateSafeSpacing,
  ORBITAL_SPACING,
  STAR_SCALE,
} from '@/lib/universe/scale-constants';

interface SolarSystemViewProps {
  solarSystem: SolarSystem;
  position: THREE.Vector3;
}

// Constants for orbital calculations
const KEPLER_ITERATION_COUNT = 5;

/**
 * Clickable planet with Keplerian orbit
 */
function PlanetMesh({
  planet,
  index,
  systemPosition,
  onClick,
  totalPlanets,
}: {
  planet: Planet;
  index: number;
  systemPosition: THREE.Vector3;
  onClick: () => void;
  totalPlanets: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);

  // Calculate orbital parameters
  const orbitalData = useMemo(() => {
    // Deterministic orbital spacing based on planet index
    const safeSpacing = calculateSafeSpacing(totalPlanets);
    const semiMajorAxis = ORBITAL_SPACING.BASE_RADIUS + index * safeSpacing;
    
    // Use minimal eccentricity for near-circular orbits (deterministic)
    // Small eccentricity adds visual interest while maintaining predictability
    const eccentricity = ORBITAL_SPACING.MAX_ECCENTRICITY * 0.3;
    
    // Use minimal inclination for mostly-flat orbital plane
    // Small inclination prevents z-fighting without unpredictability
    const inclination = ORBITAL_SPACING.MAX_INCLINATION * 0.5;
    
    // Deterministic starting position based on planet index
    // Spread planets evenly around the orbit at initialization
    const phase = (index * Math.PI * 2) / Math.max(totalPlanets, 1);
    
    // Orbital speed follows Kepler's third law approximation
    // Inner planets orbit faster than outer planets
    const orbitSpeed = 0.5 / (semiMajorAxis * semiMajorAxis);
    
    const size = calculatePlanetSize(planet.moons?.length || 0);

    return { semiMajorAxis, eccentricity, inclination, orbitSpeed, phase, size };
  }, [planet, index, totalPlanets]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const meanAnomaly = orbitalData.orbitSpeed * time + orbitalData.phase;

    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < KEPLER_ITERATION_COUNT; i++) {
      eccentricAnomaly = meanAnomaly + orbitalData.eccentricity * Math.sin(eccentricAnomaly);
    }

    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + orbitalData.eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - orbitalData.eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

    const radius =
      (orbitalData.semiMajorAxis * (1 - orbitalData.eccentricity * orbitalData.eccentricity)) /
      (1 + orbitalData.eccentricity * Math.cos(trueAnomaly));

    // Since apses are aligned with x-axis (no rotation), angle = trueAnomaly
    const angle = trueAnomaly;

    meshRef.current.position.x = systemPosition.x + Math.cos(angle) * radius;
    meshRef.current.position.y = systemPosition.y + Math.sin(angle) * radius * Math.sin(orbitalData.inclination);
    meshRef.current.position.z = systemPosition.z + Math.sin(angle) * radius * Math.cos(orbitalData.inclination);
  });

  return (
    <mesh
      ref={meshRef}
      onClick={onClick}
      onPointerOver={(e) => {
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
          setHoveredObject(hoveredObj);
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredObject(null);
      }}
    >
      <sphereGeometry args={[orbitalData.size, 16, 16]} />
      <meshStandardMaterial
        color={
          planet.theme === 'blue-green'
            ? '#2E86AB'
            : planet.theme === 'red'
            ? '#E63946'
            : planet.theme === 'earth-like'
            ? '#4A90E2'
            : '#CCCCCC'
        }
      />
    </mesh>
  );
}

/**
 * Solar system view with orbiting planets
 */
export default function SolarSystemView({ solarSystem, position }: SolarSystemViewProps) {
  const { navigateToPlanet } = useNavigationStore();
  const totalPlanets = (solarSystem.planets || []).length;

  return (
    <group position={position}>
      {/* Central star */}
      <mesh>
        <sphereGeometry args={[STAR_SCALE.RADIUS, 16, 16]} />
        <meshBasicMaterial color="#FDB813" />
        <pointLight
          color="#FDB813"
          intensity={STAR_SCALE.LIGHT_INTENSITY}
          distance={STAR_SCALE.LIGHT_DISTANCE}
        />
      </mesh>

      {/* Planets */}
      {(solarSystem.planets || []).map((planet, index) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          index={index}
          systemPosition={position}
          onClick={() => navigateToPlanet(planet.id)}
          totalPlanets={totalPlanets}
        />
      ))}
    </group>
  );
}
