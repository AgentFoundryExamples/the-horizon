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
import { resolveCelestialTheme } from '@/lib/universe/visual-themes';

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
  const glowRef = useRef<THREE.Mesh>(null);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Resolve visual theme with defaults
  const visualTheme = useMemo(() => {
    return resolveCelestialTheme(planet.visualTheme, planet.theme);
  }, [planet.visualTheme, planet.theme]);
  
  // Shared texture loader instance for caching
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  
  // Attempt to load textures if URLs provided
  // Using shared loader for caching and error handling
  const diffuseMap = useMemo(() => {
    if (!visualTheme.diffuseTexture) return null;
    
    const texture = textureLoader.load(
      visualTheme.diffuseTexture,
      undefined, // onLoad
      undefined, // onProgress
      (error) => {
        console.warn(`Failed to load diffuse texture for planet ${planet.id}:`, error);
      }
    );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, [visualTheme.diffuseTexture, textureLoader, planet.id]);
  
  const normalMap = useMemo(() => {
    if (!visualTheme.normalTexture) return null;
    
    const texture = textureLoader.load(
      visualTheme.normalTexture,
      undefined,
      undefined,
      (error) => {
        console.warn(`Failed to load normal texture for planet ${planet.id}:`, error);
      }
    );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, [visualTheme.normalTexture, textureLoader, planet.id]);
  
  // Cleanup textures on unmount or when URLs change
  useEffect(() => {
    return () => {
      if (diffuseMap) {
        diffuseMap.dispose();
      }
      if (normalMap) {
        normalMap.dispose();
      }
    };
  }, [diffuseMap, normalMap]);

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
    
    // Apply rotation for visual interest (rotation cue)
    meshRef.current.rotation.y += 0.001 * visualTheme.rotationSpeed;
    
    // Sync glow position with planet
    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.rotation.copy(meshRef.current.rotation);
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (meshRef.current) {
      // Force update of world matrices for accurate position in nested groups
      meshRef.current.updateWorldMatrix(true, false);
      
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

      console.log('Planet hover triggered:', planet.name, 'position:', worldPosition);
      
      if (onHover) {
        onHover(hoveredObj);
      }
      setHoveredObject(hoveredObj);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    console.log('Planet pointer out:', planet.name);
    
    // Delay clearing the hover to keep label visible
    hoverTimeoutRef.current = setTimeout(() => {
      if (onHover) {
        onHover(null);
      }
      setHoveredObject(null);
      hoverTimeoutRef.current = null;
    }, 150); // 150ms delay
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  // Use the resolved glow color directly (already validated and has fallback)
  const color = visualTheme.glowColor;

  return (
    <group>
      {/* Main planet mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          map={diffuseMap}
          normalMap={normalMap}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Theme-colored glow/border effect */}
      {visualTheme.glowIntensity > 0 && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[size * 1.05, 32, 32]} />
          <meshBasicMaterial
            color={visualTheme.glowColor}
            transparent
            opacity={visualTheme.glowIntensity * 0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}
