'use client';

/**
 * SceneTooltip - Specialized tooltip for 3D scenes
 * Projects 3D world coordinates to screen space for tooltip positioning
 */

import { ReactNode } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import {
  TOOLTIP_TYPOGRAPHY,
  TOOLTIP_POSITIONING,
  TOOLTIP_COLORS,
  TOOLTIP_PADDING,
} from '@/lib/tooltip-constants';

export interface SceneTooltipProps {
  /** Content to display in tooltip */
  content: string | ReactNode;
  /** 3D world position to project */
  worldPosition: THREE.Vector3;
  /** Whether tooltip is visible */
  visible: boolean;
  /** Vertical offset in pixels (negative = up, positive = down, following screen coordinates) */
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
  offsetY = TOOLTIP_POSITIONING.OFFSET_Y,
  offsetX = TOOLTIP_POSITIONING.OFFSET_X,
  fontSize = TOOLTIP_TYPOGRAPHY.FONT_SIZE,
  maxWidth = TOOLTIP_TYPOGRAPHY.MAX_WIDTH,
  distanceFactor = TOOLTIP_POSITIONING.DISTANCE_FACTOR_FAR,
  borderColor = TOOLTIP_COLORS.BORDER_COLOR,
  className = '',
}: SceneTooltipProps) {
  if (!visible) return null;

  // Build inline styles only for values that differ from CSS defaults
  // This allows CSS media queries to work for responsive sizing
  const inlineStyles: React.CSSProperties = {
    border: `2px solid ${borderColor}`,
  };
  
  // Only override CSS if custom values provided
  if (fontSize !== TOOLTIP_TYPOGRAPHY.FONT_SIZE) {
    inlineStyles.fontSize = fontSize;
  }
  if (maxWidth !== TOOLTIP_TYPOGRAPHY.MAX_WIDTH) {
    inlineStyles.maxWidth = maxWidth;
  }

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
          className={className ? `scene-tooltip ${className}` : 'scene-tooltip'}
          style={inlineStyles}
          role="tooltip"
          aria-live="polite"
        >
          {content}
        </div>
      </Html>
    </group>
  );
}
