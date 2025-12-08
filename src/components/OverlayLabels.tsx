'use client';

/**
 * OverlayLabels - DOM-based overlay for hover labels
 * Renders 2D labels that float above the 3D canvas using HTML and CSS
 */

import { useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { createPortal } from 'react-dom';
import { useHoverStore } from '@/lib/hover-store';
import { projectToScreen, clampToScreen, calculateLabelOffset } from '@/lib/projection';
import '../styles/overlay-labels.css';

interface LabelPosition {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Inner component that uses useThree and renders via portal
 */
function OverlayLabelsInner() {
  const { camera, size } = useThree();
  const hoveredObject = useHoverStore((state) => state.hoveredObject);
  const labelsVisible = useHoverStore((state) => state.labelsVisible);
  const [position, setPosition] = useState<LabelPosition | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Create container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'overlay-labels-container';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 200;';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current);
      }
    };
  }, []);

  // Update position every frame
  useFrame(() => {
    if (!hoveredObject || !labelsVisible) {
      setPosition(null);
      return;
    }

    const screenPos = projectToScreen(
      hoveredObject.position,
      camera,
      size.width,
      size.height
    );

    if (screenPos.isBehindCamera) {
      setPosition({ x: 0, y: 0, visible: false });
    } else {
      const clamped = clampToScreen(screenPos.x, screenPos.y, size.width, size.height);
      const offset = calculateLabelOffset(clamped.x, clamped.y);

      setPosition({
        x: offset.x,
        y: offset.y,
        visible: !screenPos.isOffScreen,
      });
    }
  });

  if (!hoveredObject || !labelsVisible || !position || !position.visible || !containerRef.current) {
    return null;
  }

  const { name, type, metadata } = hoveredObject;

  // Render label via portal to container outside Canvas
  return createPortal(
    <div
      className="overlay-label"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="overlay-label-content">
        <div className="overlay-label-name">{name}</div>
        <div className="overlay-label-type">{type}</div>
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
    </div>,
    containerRef.current
  );
}

/**
 * OverlayLabels component - must be inside Canvas
 */
export default function OverlayLabels() {
  return <OverlayLabelsInner />;
}
