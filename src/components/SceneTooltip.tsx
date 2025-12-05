'use client';

/**
 * SceneTooltip - Specialized tooltip for 3D scenes
 * Projects 3D world coordinates to screen space for tooltip positioning
 */

import { ReactNode } from 'react';
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
  /** Border color override */
  borderColor?: string;
  /** Additional CSS class name */
  className?: string;
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
  borderColor = 'rgba(74, 144, 226, 0.7)',
  className = '',
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
          className={`scene-tooltip ${className}`}
          style={{
            fontSize: fontSize,
            maxWidth: maxWidth,
            border: `2px solid ${borderColor}`,
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
