'use client';

/**
 * GalaxyView - Shows galaxy details with solar systems and Keplerian orbits
 * Uses shared planetary system components for consistency with SolarSystemView
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Galaxy, Star } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG } from '@/lib/animation';
import { GALAXY_VIEW_SCALE, GALAXY_ORBIT_STYLE, GALAXY_VIEW_PLANETARY_SCALE } from '@/lib/universe/scale-constants';
import { createSeededRandom, generateSeedFromId } from '@/lib/seeded-random';
import {
  DEFAULT_GRAPHICS_CONFIG,
  createGalaxyRenderConfig,
  generateGalaxy,
  updateGalaxy,
  disposeGalaxy,
  type GalaxyData,
  type GalaxyTheme,
} from '@/lib/graphics';
import { OrbitRing } from './OrbitRing';
import { PlanetarySystem } from './shared/PlanetarySystem';
import { CentralStar } from './shared/CentralStar';

interface StarInstanceProps {
  star: Star;
  position: THREE.Vector3;
  animationConfig: ReturnType<typeof getAnimationConfig>;
}

/**
 * Free-floating star rendering
 * Now uses shared CentralStar component
 */
function StarInstance({ star, position, animationConfig }: StarInstanceProps) {
  return (
    <CentralStar
      star={star}
      position={position}
      radius={0.4}
      lightIntensity={0.5}
      lightDistance={10}
      animationConfig={animationConfig}
      enablePulse={true} // Enable pulsing for free-floating stars
    />
  );
}

/**
 * Map galaxy particle color theme to galaxy renderer theme
 */
function mapGalaxyTheme(particleColor?: string): GalaxyTheme {
  if (!particleColor) return 'classic';
  
  const color = new THREE.Color(particleColor);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  
  // Map based on hue
  // HSL hue ranges: 0=red, 0.15=orange/yellow, 0.33=green, 0.5=cyan, 0.67=blue, 0.83=purple, 1=red
  if (hsl.s < 0.2) return 'ethereal'; // Low saturation = ethereal
  if (hsl.h < 0.15 || hsl.h > 0.95) return 'molten'; // Red/orange
  if (hsl.h >= 0.15 && hsl.h < 0.4) return 'neon'; // Yellow/green/cyan
  // Fix: Cover the cyan/blue range (0.4-0.75) that was previously split
  if (hsl.h >= 0.4 && hsl.h < 0.75) return 'neon'; // Cyan/blue/purple
  if (hsl.h >= 0.75 && hsl.h < 0.95) return 'dark-matter'; // Deep purple
  
  return 'classic';
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
  const galaxyDataRef = useRef<GalaxyData | null>(null);
  const galaxyLayerRefs = useRef<(THREE.Points | null)[]>([]);
  const { navigateToSolarSystem } = useNavigationStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationConfig = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, prefersReducedMotion);

  // Generate layered galaxy background on mount
  useEffect(() => {
    const theme = mapGalaxyTheme(galaxy.particleColor);
    const config = createGalaxyRenderConfig(
      DEFAULT_GRAPHICS_CONFIG.galaxyView,
      theme,
      DEFAULT_GRAPHICS_CONFIG.universe.lowPowerMode ?? false
    );
    const galaxyData = generateGalaxy(config);
    galaxyDataRef.current = galaxyData;
    
    // Log warning if shader compilation failed
    if (galaxyData.fallbackMode && galaxyData.shaderError) {
      console.warn('Galaxy using fallback rendering:', galaxyData.shaderError);
    }
    
    return () => {
      if (galaxyDataRef.current) {
        disposeGalaxy(galaxyDataRef.current);
      }
    };
  }, [galaxy.id, galaxy.particleColor]);

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
    
    // Update layered galaxy animation
    if (galaxyDataRef.current) {
      updateGalaxy(galaxyDataRef.current, state.clock.getElapsedTime());
    }
    
    // Particle drift animation for simple background particles
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
      {/* Layered galaxy background renderer */}
      {galaxyDataRef.current && galaxyDataRef.current.layers.map((layer, index) => (
        <points
          key={`${galaxy.id}-layer-${index}`}
          ref={(el) => { galaxyLayerRefs.current[index] = el; }}
          geometry={layer.geometry}
          material={layer.material}
        />
      ))}
      
      {/* Galaxy rings for visual alignment */}
      {(galaxy.solarSystems && galaxy.solarSystems.length > 0) && (
        <OrbitRing
          radius={GALAXY_VIEW_SCALE.SOLAR_SYSTEM_RING_RADIUS}
          color={GALAXY_ORBIT_STYLE.COLOR}
          opacity={GALAXY_ORBIT_STYLE.OPACITY}
          lineWidth={GALAXY_ORBIT_STYLE.LINE_WIDTH}
          dashPattern={GALAXY_ORBIT_STYLE.DASH_PATTERN}
          segments={GALAXY_VIEW_SCALE.RING_SEGMENTS}
        />
      )}
      {(galaxy.stars && galaxy.stars.length > 0) && (
        <OrbitRing
          radius={GALAXY_VIEW_SCALE.STAR_RING_RADIUS}
          color={GALAXY_ORBIT_STYLE.COLOR}
          opacity={GALAXY_ORBIT_STYLE.OPACITY}
          lineWidth={GALAXY_ORBIT_STYLE.LINE_WIDTH}
          dashPattern={GALAXY_ORBIT_STYLE.DASH_PATTERN}
          segments={GALAXY_VIEW_SCALE.RING_SEGMENTS}
        />
      )}

      {/* Solar systems with orbiting planets - now using shared PlanetarySystem component */}
      {(galaxy.solarSystems || []).map((system, index) => (
        <PlanetarySystem
          key={system.id}
          solarSystem={system}
          position={systemPositions[index]}
          onStarClick={() => navigateToSolarSystem(system.id)}
          scale={GALAXY_VIEW_PLANETARY_SCALE}
          animationConfig={animationConfig}
        />
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
