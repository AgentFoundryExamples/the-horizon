'use client';

/**
 * OrbitRing - Shared orbit ring component for galaxy and solar system views
 * Provides visual guides for orbital paths with customizable styling
 */

import { useMemo } from 'react';
import * as THREE from 'three';

export interface OrbitRingStyleProps {
  /**
   * Ring color (hex string)
   */
  color: string;
  
  /**
   * Ring opacity (0-1)
   */
  opacity: number;
  
  /**
   * Line width for rendering
   * Note: lineWidth is not reliably supported across all platforms in WebGL
   * Use this primarily for documentation; actual stroke width may vary
   */
  lineWidth?: number;
  
  /**
   * Dash pattern for dashed lines
   * [dash length, gap length]
   * undefined = solid line
   */
  dashPattern?: [number, number];
}

export interface OrbitRingProps extends OrbitRingStyleProps {
  /**
   * Radius of the orbit ring
   */
  radius: number;
  
  /**
   * Number of segments for smooth circle rendering
   * Higher = smoother but more expensive
   */
  segments?: number;
}

/**
 * OrbitRing component
 * Renders a circular orbital path with customizable styling
 */
export function OrbitRing({
  radius,
  color,
  opacity,
  lineWidth = 1,
  dashPattern,
  segments = 64,
}: OrbitRingProps) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius, segments]);

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
      {dashPattern ? (
        <lineDashedMaterial
          color={color}
          transparent
          opacity={opacity}
          linewidth={lineWidth}
          dashSize={dashPattern[0]}
          gapSize={dashPattern[1]}
        />
      ) : (
        <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={lineWidth} />
      )}
    </line>
  );
}
