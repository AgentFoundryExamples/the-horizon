'use client';

/**
 * GalaxyView - Shows galaxy details with solar systems and Keplerian orbits
 * Uses instanced meshes for performance
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Galaxy, SolarSystem, Star } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG } from '@/lib/animation';
import { GALAXY_VIEW_SCALE } from '@/lib/universe/scale-constants';
import { createSeededRandom, generateSeedFromId } from '@/lib/seeded-random';

interface OrbitRingProps {
  radius: number;
  color: string;
}

/**
 * Simple orbit ring visualization
 * Renders a circular path at the specified radius
 */
function OrbitRing({ radius, color }: OrbitRingProps) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= GALAXY_VIEW_SCALE.RING_SEGMENTS; i++) {
      const angle = (i / GALAXY_VIEW_SCALE.RING_SEGMENTS) * Math.PI * 2;
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
      <lineBasicMaterial color={color} transparent opacity={GALAXY_VIEW_SCALE.RING_OPACITY} />
    </line>
  );
}

interface PlanetInstanceProps {
  solarSystem: SolarSystem;
  systemPosition: THREE.Vector3;
  animationConfig: ReturnType<typeof getAnimationConfig>;
}

/**
 * Planets orbiting a star using Keplerian motion
 */

// Constants for orbital calculations
// 5 iterations provides sufficient accuracy for the eccentric anomaly approximation
// while maintaining 60 FPS performance. More iterations yield diminishing returns.
const KEPLER_ITERATION_COUNT = 5;

/**
 * Free-floating star rendering
 */
function PlanetInstance({ solarSystem, systemPosition, animationConfig }: PlanetInstanceProps) {
  const planetsRef = useRef<THREE.Group>(null);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);

  const planetData = useMemo(() => {
    return (solarSystem.planets || []).map((planet, index) => {
      // Create a unique seed for each planet for deterministic randomness
      const seed = generateSeedFromId(solarSystem.id, index);
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
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          // Get world position of the mesh for accurate hover tracking
          const mesh = e.object as THREE.Mesh;
          const worldPosition = new THREE.Vector3();
          mesh.getWorldPosition(worldPosition);
          
          const hoveredObj: HoveredObject = {
            id: solarSystem.id,
            name: solarSystem.name,
            type: 'solar-system',
            position: worldPosition,
            metadata: {
              planetCount: solarSystem.planets?.length || 0,
            },
          };
          setHoveredObject(hoveredObj);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredObject(null);
        }}
      >
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#FDB813" />
          <pointLight color="#FDB813" intensity={1} distance={20} />
        </mesh>
      </group>

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
          <group key={`planet-${index}`}>
            <mesh>
              <sphereGeometry args={[data.size, 8, 8]} />
              <meshStandardMaterial
                color={data.planet.theme === 'blue-green' ? '#2E86AB' : 
                       data.planet.theme === 'red' ? '#E63946' : '#CCCCCC'}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

interface StarInstanceProps {
  star: Star;
  position: THREE.Vector3;
  animationConfig: ReturnType<typeof getAnimationConfig>;
}

/**
 * Free-floating star rendering
 */
function StarInstance({ star, position, animationConfig }: StarInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);

  useFrame((state) => {
    if (meshRef.current && animationConfig.rotation) {
      // Gentle pulsing (controlled by animation config)
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1 * animationConfig.intensity;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          // Get world position of the mesh for accurate hover tracking
          const mesh = e.object as THREE.Mesh;
          const worldPosition = new THREE.Vector3();
          mesh.getWorldPosition(worldPosition);
          
          const hoveredObj: HoveredObject = {
            id: star.id,
            name: star.name,
            type: 'star',
            position: worldPosition,
          };
          setHoveredObject(hoveredObj);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          setHoveredObject(null);
        }}
      >
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
    </group>
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
  const particlesRef = useRef<THREE.Points>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const { navigateToSolarSystem } = useNavigationStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationConfig = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, prefersReducedMotion);

  // Layout solar systems in a circle aligned to ring
  const systemPositions = useMemo(() => {
    const systems = galaxy.solarSystems || [];
    const radius = GALAXY_VIEW_SCALE.SOLAR_SYSTEM_RING_RADIUS;
    return systems.map((_, index) => {
      const angle = (index / systems.length) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    });
  }, [galaxy.solarSystems?.map(s => s.id).join(',')]);

  // Layout free-floating stars on outer ring
  const starPositions = useMemo(() => {
    const stars = galaxy.stars || [];
    const radius = GALAXY_VIEW_SCALE.STAR_RING_RADIUS;
    
    return stars.map((star, index) => {
      const seed = generateSeedFromId(galaxy.id, index + 1000);
      const seededRandom = createSeededRandom(seed);
      
      const angle = (index / stars.length) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        (seededRandom() - 0.5) * 5, // Deterministic Y variance for depth
        Math.sin(angle) * radius
      );
    });
  }, [galaxy.id, galaxy.stars?.map(s => s.id).join(',')]);

  // Reset original positions when galaxy changes to avoid using stale data
  useEffect(() => {
    originalPositionsRef.current = null;
  }, [galaxy]);

  // Gentle rotation and particle drift
  useFrame((state) => {
    if (groupRef.current && animationConfig.rotation) {
      groupRef.current.rotation.y += 0.001 * animationConfig.rotationSpeed * animationConfig.intensity;
    }
    
    // Particle drift animation
    if (particlesRef.current && animationConfig.particleDrift) {
      const time = state.clock.getElapsedTime();
      const geometry = particlesRef.current.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Store original positions on first frame
      if (!originalPositionsRef.current) {
        originalPositionsRef.current = new Float32Array(positions);
      }
      
      const originals = originalPositionsRef.current;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Calculate offsets from original positions
        positions[i] = originals[i] + Math.sin(time * 0.1 + i) * 0.01 * animationConfig.driftSpeed;
        positions[i + 2] = originals[i + 2] + Math.cos(time * 0.1 + i) * 0.01 * animationConfig.driftSpeed;
      }
      
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Galaxy rings for visual alignment */}
      {(galaxy.solarSystems && galaxy.solarSystems.length > 0) && (
        <OrbitRing
          radius={GALAXY_VIEW_SCALE.SOLAR_SYSTEM_RING_RADIUS}
          color={GALAXY_VIEW_SCALE.RING_COLOR}
        />
      )}
      {(galaxy.stars && galaxy.stars.length > 0) && (
        <OrbitRing
          radius={GALAXY_VIEW_SCALE.STAR_RING_RADIUS}
          color={GALAXY_VIEW_SCALE.RING_COLOR}
        />
      )}

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
            animationConfig={animationConfig}
          />
        </group>
      ))}

      {/* Free-floating stars */}
      {(galaxy.stars || []).map((star, index) => (
        <StarInstance
          key={star.id}
          star={star}
          position={starPositions[index]}
          animationConfig={animationConfig}
        />
      ))}

      {/* Background particle field for atmosphere */}
      <points ref={particlesRef}>
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
