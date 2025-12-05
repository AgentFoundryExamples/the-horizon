'use client';

/**
 * SceneTooltip - Specialized tooltip for 3D scenes
 * Projects 3D world coordinates to screen space for tooltip positioning
 */

import { useState, useEffect, ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export interface SceneTooltipProps {
  /** Content to display in tooltip */
  content: string | ReactNode;
  /** 3D world position to project */
  worldPosition: THREE.Vector3;
  /** Whether tooltip is visible */
  visible: boolean;
  /** Vertical offset in pixels (positive = up) */
  offsetY?: number;
  /** Horizontal offset in pixels (positive = right) */
  offsetX?: number;
  /** Font size for tooltip text */
  fontSize?: string;
  /** Maximum width for tooltip */
  maxWidth?: string;
  /** Distance factor for scaling (higher = less scaling with distance) */
  distanceFactor?: number;
}

/**
 * SceneTooltip component for 3D scenes
 * Uses Html from @react-three/drei for proper 3D-to-2D projection
 */
export default function SceneTooltip({
  content,
  worldPosition,
  visible,
  offsetY = -40,
  offsetX = 0,
  fontSize = '1rem',
  maxWidth = '300px',
  distanceFactor = 50,
}: SceneTooltipProps) {
  if (!visible) return null;

  return (
    <group position={worldPosition}>
      <Html
        distanceFactor={distanceFactor}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#FFFFFF',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '2px solid rgba(74, 144, 226, 0.7)',
            fontSize: fontSize,
            maxWidth: maxWidth,
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            textAlign: 'center',
          }}
          role="tooltip"
          aria-live="polite"
        >
          {content}
        </div>
      </Html>
    </group>
  );
}

/**
 * Hook to project 3D world coordinates to 2D screen coordinates
 * Useful for custom tooltip positioning outside of the Three.js scene
 */
export function useWorldToScreen(worldPosition: THREE.Vector3): { x: number; y: number } | null {
  const { camera, size } = useThree();
  const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const vector = worldPosition.clone();
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * size.width;
    const y = (vector.y * -0.5 + 0.5) * size.height;

    setScreenPosition({ x, y });
  }, [worldPosition, camera, size]);

  return screenPosition;
}
