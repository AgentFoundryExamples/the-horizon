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
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SolarSystem, Planet } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import {
  calculatePlanetSize,
  calculateOrbitalRadius,
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
  const [hovered, setHovered] = useState(false);

  // Calculate orbital parameters
  const orbitalData = useMemo(() => {
    const seed = planet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };

    // Use new scale constants for improved usability
    const safeSpacing = calculateSafeSpacing(totalPlanets);
    const semiMajorAxis = ORBITAL_SPACING.BASE_RADIUS + index * safeSpacing;
    const eccentricity = seededRandom() * ORBITAL_SPACING.MAX_ECCENTRICITY;
    const inclination = (seededRandom() - 0.5) * ORBITAL_SPACING.MAX_INCLINATION * 2;
    const argumentOfPeriapsis = seededRandom() * Math.PI * 2;
    const orbitSpeed = 0.5 / (semiMajorAxis * semiMajorAxis);
    const phase = seededRandom() * Math.PI * 2;
    const size = calculatePlanetSize(planet.moons?.length || 0);

    return { semiMajorAxis, eccentricity, inclination, argumentOfPeriapsis, orbitSpeed, phase, size };
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

    const angle = trueAnomaly + orbitalData.argumentOfPeriapsis;

    meshRef.current.position.x = systemPosition.x + Math.cos(angle) * radius;
    meshRef.current.position.y = systemPosition.y + Math.sin(angle) * radius * Math.sin(orbitalData.inclination);
    meshRef.current.position.z = systemPosition.z + Math.sin(angle) * radius * Math.cos(orbitalData.inclination);
  });

  return (
    <>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
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
      {hovered && meshRef.current && (
        <Html
          position={[
            meshRef.current.position.x,
            meshRef.current.position.y + orbitalData.size + 1,
            meshRef.current.position.z,
          ]}
          distanceFactor={10}
          center
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              color: '#FFFFFF',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '2px solid rgba(74, 144, 226, 0.7)',
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              textAlign: 'center',
            }}
            role="tooltip"
            aria-live="polite"
          >
            <strong>{planet.name}</strong>
            {planet.moons && planet.moons.length > 0 && (
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.9 }}>
                {planet.moons.length} moon{planet.moons.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}

/**
 * Solar system view with orbiting planets
 */
export default function SolarSystemView({ solarSystem, position }: SolarSystemViewProps) {
  const { navigateToPlanet } = useNavigationStore();
  const totalPlanets = (solarSystem.planets || []).length;
  const [starHovered, setStarHovered] = useState(false);

  return (
    <group position={position}>
      {/* Central star */}
      <group>
        <mesh
          onPointerOver={() => setStarHovered(true)}
          onPointerOut={() => setStarHovered(false)}
        >
          <sphereGeometry args={[STAR_SCALE.RADIUS, 16, 16]} />
          <meshBasicMaterial color="#FDB813" />
          <pointLight
            color="#FDB813"
            intensity={STAR_SCALE.LIGHT_INTENSITY}
            distance={STAR_SCALE.LIGHT_DISTANCE}
          />
        </mesh>
        {starHovered && (
          <Html
            position={[0, STAR_SCALE.RADIUS + 1.5, 0]}
            distanceFactor={10}
            center
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                color: '#FFFFFF',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '2px solid rgba(251, 184, 19, 0.7)',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                textAlign: 'center',
              }}
              role="tooltip"
              aria-live="polite"
            >
              <strong>{solarSystem.name}</strong>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.9 }}>
                Star
              </div>
            </div>
          </Html>
        )}
      </group>

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
