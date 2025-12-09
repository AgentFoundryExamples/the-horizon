'use client';

/**
 * OverlayLabels - DOM-based overlay for hover labels
 * Renders 2D labels that float above the 3D canvas using Drei's Html component
 * Now supports per-scene configuration for optimal readability at different zoom levels
 */

import { Html } from '@react-three/drei';
import { useHoverStore } from '@/lib/hover-store';
import { useNavigationStore } from '@/lib/store';
import { getLabelConfig } from '@/lib/label-config';
import '../styles/overlay-labels.css';

/**
 * OverlayLabels component - must be inside Canvas
 * Uses Drei's Html component to render DOM content in 3D space
 * Applies per-scene styling based on current focus level
 */
export default function OverlayLabels() {
  const hoveredObject = useHoverStore((state) => state.hoveredObject);
  const labelsVisible = useHoverStore((state) => state.labelsVisible);
  const focusLevel = useNavigationStore((state) => state.focusLevel);

  // Don't render if no object is hovered or labels are hidden
  if (!hoveredObject || !labelsVisible) {
    return null;
  }

  const { name, type, metadata, position } = hoveredObject;

  // Get per-scene label configuration
  const labelConfig = getLabelConfig(focusLevel);

  // Defensive check: ensure position has valid coordinates before rendering
  // This protects against edge cases where store validation might be bypassed
  if (!position || 
      typeof position.x !== 'number' || 
      typeof position.y !== 'number' || 
      typeof position.z !== 'number') {
    console.warn('OverlayLabels: Invalid position structure, skipping render', position);
    return null;
  }

  // Check for NaN or Infinity (safe now that we know they're numbers)
  if (!isFinite(position.x) || 
      !isFinite(position.y) || 
      !isFinite(position.z)) {
    console.warn('OverlayLabels: Position contains invalid numbers, skipping render', position);
    return null;
  }

  return (
    <Html
      position={[position.x, position.y, position.z]}
      center
      distanceFactor={labelConfig.distanceFactor}
      zIndexRange={[200, 0]}
      sprite
      occlude={false}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      // Clamp to viewport boundaries to prevent off-screen rendering
      transform
      wrapperClass="overlay-label-wrapper"
    >
      <div 
        className="overlay-label" 
        role="tooltip" 
        aria-live="polite"
        style={{
          // Apply per-scene offset
          transform: `translate(-50%, calc(-100% - ${labelConfig.offsetY}px))`,
        }}
      >
        <div 
          className={`overlay-label-content ${labelConfig.enableGlow ? 'with-glow' : 'no-glow'}`}
          style={{
            minWidth: labelConfig.minWidth,
            maxWidth: labelConfig.maxWidth,
            backgroundColor: labelConfig.backgroundOpacity !== undefined 
              ? `rgba(0, 0, 0, ${labelConfig.backgroundOpacity})` 
              : undefined,
            borderColor: labelConfig.borderColor,
          }}
        >
          <div 
            className="overlay-label-name"
            style={{
              fontSize: labelConfig.fontSize,
              whiteSpace: labelConfig.textWrap,
            }}
          >{name}</div>
          <div 
            className="overlay-label-type"
            style={{
              fontSize: labelConfig.typeFontSize,
            }}
          >{type}</div>
          {metadata?.description && (
            <div className="overlay-label-description">{metadata.description}</div>
          )}
          {metadata?.planetCount !== undefined && (
            <div className="overlay-label-meta">
              {metadata.planetCount} {metadata.planetCount === 1 ? 'planet' : 'planets'}
            </div>
          )}
          {metadata?.moonCount !== undefined && metadata.moonCount > 0 && (
            <div className="overlay-label-meta">
              {metadata.moonCount} {metadata.moonCount === 1 ? 'moon' : 'moons'}
            </div>
          )}
        </div>
        <div className="overlay-label-pointer" />
      </div>
    </Html>
  );
}
