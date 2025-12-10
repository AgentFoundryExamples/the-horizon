'use client';

/**
 * CentralStar - Shared component for rendering a central star/sun
 * Used by both GalaxyView and SolarSystemView with different scale parameters
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SolarSystem, Star } from '@/lib/universe/types';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import type { getAnimationConfig } from '@/lib/animation';

interface CentralStarProps {
  // Either a solar system or a standalone star
  solarSystem?: SolarSystem;
  star?: Star;
  position: THREE.Vector3;
  onClick?: () => void;
  onHover?: (hoveredObj: HoveredObject | null) => void;
  // Visual parameters
  radius: number;
  color?: string;
  lightIntensity?: number;
  lightDistance?: number;
  // Animation parameters
  animationConfig?: ReturnType<typeof getAnimationConfig>;
  enablePulse?: boolean;
}

// Star pulsing animation constants
// Frequency multiplier for pulsing effect
const PULSE_FREQUENCY = 2;
// Amplitude of the pulsing scale effect (0.1 = 10% size variation)
const PULSE_AMPLITUDE = 0.1;

/**
 * CentralStar component
 * Renders a star with optional pulsing animation and lighting
 */
export function CentralStar({
  solarSystem,
  star,
  position,
  onClick,
  onHover,
  radius,
  color,
  lightIntensity = 1,
  lightDistance = 20,
  animationConfig,
  enablePulse = false,
}: CentralStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);

  // Determine star properties
  const starId = solarSystem?.id || star?.id || 'unknown';
  const starName = solarSystem?.name || star?.name || 'Unknown Star';
  const starType = solarSystem ? 'solar-system' : 'star';

  // Determine star color
  const starColor = useMemo(() => {
    if (color) return color;
    if (star) {
      if (star.theme.includes('yellow')) return '#FDB813';
      if (star.theme.includes('red')) return '#E63946';
      if (star.theme.includes('blue')) return '#4A90E2';
      return '#FFFFFF';
    }
    return '#FDB813'; // Default yellow for solar system stars
  }, [color, star]);

  // Pulsing animation for standalone stars
  useFrame((state) => {
    if (meshRef.current && enablePulse && animationConfig?.rotation) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * PULSE_FREQUENCY) * PULSE_AMPLITUDE * (animationConfig.intensity || 1);
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);

    if (meshRef.current) {
      // Force update of world matrices for accurate position in nested groups
      meshRef.current.updateWorldMatrix(true, false);
      
      // Get world position of the mesh for accurate hover tracking
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);

      const hoveredObj: HoveredObject = {
        id: starId,
        name: starName,
        type: starType,
        position: worldPosition,
        metadata: solarSystem ? {
          planetCount: solarSystem.planets?.length || 0,
        } : undefined,
      };

      setHoveredObject(hoveredObj);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    setHoveredObject(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial color={starColor} />
        <pointLight color={starColor} intensity={lightIntensity} distance={lightDistance} />
      </mesh>
    </group>
  );
}
