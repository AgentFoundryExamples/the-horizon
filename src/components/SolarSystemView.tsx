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

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SolarSystem, Planet } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';

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
}: {
  planet: Planet;
  index: number;
  systemPosition: THREE.Vector3;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate orbital parameters
  const orbitalData = useMemo(() => {
    const seed = planet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };

    const semiMajorAxis = 2 + index * 1.5;
    const eccentricity = seededRandom() * 0.1;
    const inclination = (seededRandom() - 0.5) * 0.2;
    const argumentOfPeriapsis = seededRandom() * Math.PI * 2;
    const orbitSpeed = 0.5 / (semiMajorAxis * semiMajorAxis);
    const phase = seededRandom() * Math.PI * 2;
    const size = 0.3 + (planet.moons?.length || 0) * 0.05;

    return { semiMajorAxis, eccentricity, inclination, argumentOfPeriapsis, orbitSpeed, phase, size };
  }, [planet, index]);

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

    const angle = trueAnomaly + orbitalData.argumentOfPeriapsis;

    meshRef.current.position.x = systemPosition.x + Math.cos(angle) * radius;
    meshRef.current.position.y = systemPosition.y + Math.sin(angle) * radius * Math.sin(orbitalData.inclination);
    meshRef.current.position.z = systemPosition.z + Math.sin(angle) * radius * Math.cos(orbitalData.inclination);
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
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

  return (
    <group position={position}>
      {/* Central star */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#FDB813" />
        <pointLight color="#FDB813" intensity={2} distance={20} />
      </mesh>

      {/* Planets */}
      {(solarSystem.planets || []).map((planet, index) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          index={index}
          systemPosition={position}
          onClick={() => navigateToPlanet(planet.id)}
        />
      ))}
    </group>
  );
}
