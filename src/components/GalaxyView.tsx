'use client';

/**
 * GalaxyView - Shows galaxy details with solar systems and Keplerian orbits
 * Uses instanced meshes for performance
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Galaxy, SolarSystem, Star } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';

interface OrbitRingProps {
  radius: number;
  color: string;
}

/**
 * Simple orbit ring visualization
 */
function OrbitRing({ radius, color }: OrbitRingProps) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
}

interface PlanetInstanceProps {
  solarSystem: SolarSystem;
  systemPosition: THREE.Vector3;
}

/**
 * Planets orbiting a star using Keplerian motion
 */

// Constants for orbital calculations
// 5 iterations provides sufficient accuracy for the eccentric anomaly approximation
// while maintaining 60 FPS performance. More iterations yield diminishing returns.
const KEPLER_ITERATION_COUNT = 5;

function PlanetInstance({ solarSystem, systemPosition }: PlanetInstanceProps) {
  const planetsRef = useRef<THREE.Group>(null);

  const planetData = useMemo(() => {
    // Seeded pseudo-random number generator for deterministic orbits
    // Uses Linear Congruential Generator with parameters from Numerical Recipes
    // (a=9301, c=49297, m=233280) which provides good distribution for small sequences
    const createSeededRandom = (seed: number) => {
      let state = seed;
      return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
    };

    return (solarSystem.planets || []).map((planet, index) => {
      // Create a unique seed for each planet for deterministic randomness
      const seed = solarSystem.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
      const seededRandom = createSeededRandom(seed);

      // Simple Keplerian orbit parameters
      const semiMajorAxis = 2 + index * 1.5;
      const eccentricity = seededRandom() * 0.1; // Slight ellipse
      const inclination = (seededRandom() - 0.5) * 0.2; // Small inclination
      const argumentOfPeriapsis = seededRandom() * Math.PI * 2;
      const orbitSpeed = 0.5 / (semiMajorAxis * semiMajorAxis); // Kepler's third law approximation

      return {
        planet,
        semiMajorAxis,
        eccentricity,
        inclination,
        argumentOfPeriapsis,
        orbitSpeed,
        phase: seededRandom() * Math.PI * 2, // Random but deterministic starting position
        size: 0.3 + (planet.moons?.length || 0) * 0.05,
      };
    });
  }, [solarSystem]);

  useFrame((state) => {
    if (!planetsRef.current) return;

    const time = state.clock.getElapsedTime();

    planetsRef.current.children.forEach((child, index) => {
      if (index >= planetData.length) return;
      
      const data = planetData[index];
      const meanAnomaly = data.orbitSpeed * time + data.phase;
      
      // Simplified Keplerian orbit calculation
      let eccentricAnomaly = meanAnomaly;
      for (let i = 0; i < KEPLER_ITERATION_COUNT; i++) {
        eccentricAnomaly = meanAnomaly + data.eccentricity * Math.sin(eccentricAnomaly);
      }

      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + data.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - data.eccentricity) * Math.cos(eccentricAnomaly / 2)
      );

      const radius = data.semiMajorAxis * (1 - data.eccentricity * data.eccentricity) / 
                     (1 + data.eccentricity * Math.cos(trueAnomaly));

      const angle = trueAnomaly + data.argumentOfPeriapsis;

      child.position.x = Math.cos(angle) * radius;
      child.position.y = Math.sin(angle) * radius * Math.sin(data.inclination);
      child.position.z = Math.sin(angle) * radius * Math.cos(data.inclination);
    });
  });

  return (
    <group position={systemPosition}>
      {/* Central star */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#FDB813" />
        <pointLight color="#FDB813" intensity={1} distance={20} />
      </mesh>

      {/* Orbit rings */}
      {planetData.map((data, index) => (
        <OrbitRing
          key={`orbit-${index}`}
          radius={data.semiMajorAxis}
          color="#4A90E2"
        />
      ))}

      {/* Planets */}
      <group ref={planetsRef}>
        {planetData.map((data, index) => (
          <mesh key={`planet-${index}`}>
            <sphereGeometry args={[data.size, 8, 8]} />
            <meshStandardMaterial
              color={data.planet.theme === 'blue-green' ? '#2E86AB' : 
                     data.planet.theme === 'red' ? '#E63946' : '#CCCCCC'}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

interface StarInstanceProps {
  star: Star;
  position: THREE.Vector3;
}

/**
 * Free-floating star rendering
 */
function StarInstance({ star, position }: StarInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshBasicMaterial
        color={star.theme.includes('yellow') ? '#FDB813' :
               star.theme.includes('red') ? '#E63946' :
               star.theme.includes('blue') ? '#4A90E2' : '#FFFFFF'}
      />
      <pointLight
        color={star.theme.includes('yellow') ? '#FDB813' :
               star.theme.includes('red') ? '#E63946' :
               star.theme.includes('blue') ? '#4A90E2' : '#FFFFFF'}
        intensity={0.5}
        distance={10}
      />
    </mesh>
  );
}

interface GalaxyViewProps {
  galaxy: Galaxy;
  position: THREE.Vector3;
}

// Constants for background particle field
const BACKGROUND_PARTICLE_COUNT = 500;
const BACKGROUND_PARTICLE_RANGE = 40;

/**
 * Galaxy detail view showing stars and solar systems
 */
export default function GalaxyView({ galaxy, position }: GalaxyViewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { navigateToSolarSystem } = useNavigationStore();

  // Layout solar systems in a circle
  const systemPositions = useMemo(() => {
    const systems = galaxy.solarSystems || [];
    const radius = 10;
    return systems.map((_, index) => {
      const angle = (index / systems.length) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    });
  }, [galaxy.solarSystems]);

  // Layout free-floating stars
  const starPositions = useMemo(() => {
    const stars = galaxy.stars || [];
    const radius = 15;
    return stars.map((_, index) => {
      const angle = (index / stars.length) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 5,
        Math.sin(angle) * radius
      );
    });
  }, [galaxy.stars]);

  // Gentle rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Solar systems with orbiting planets */}
      {(galaxy.solarSystems || []).map((system, index) => (
        <group
          key={system.id}
          onClick={(e) => {
            e.stopPropagation();
            navigateToSolarSystem(system.id);
          }}
        >
          <PlanetInstance
            solarSystem={system}
            systemPosition={systemPositions[index]}
          />
        </group>
      ))}

      {/* Free-floating stars */}
      {(galaxy.stars || []).map((star, index) => (
        <StarInstance
          key={star.id}
          star={star}
          position={starPositions[index]}
        />
      ))}

      {/* Background particle field for atmosphere */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={BACKGROUND_PARTICLE_COUNT}
            array={new Float32Array(
              Array.from({ length: BACKGROUND_PARTICLE_COUNT }, () => [
                (Math.random() - 0.5) * BACKGROUND_PARTICLE_RANGE,
                (Math.random() - 0.5) * BACKGROUND_PARTICLE_RANGE,
                (Math.random() - 0.5) * BACKGROUND_PARTICLE_RANGE,
              ]).flat()
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={galaxy.particleColor}
          transparent
          opacity={0.3}
        />
      </points>
    </group>
  );
}
