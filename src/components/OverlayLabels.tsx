'use client';

/**
 * OverlayLabels - DOM-based overlay for hover labels
 * Renders 2D labels that float above the 3D canvas using HTML and CSS
 */

import { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number; visible: boolean } | null>(null);

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

  // Update position every frame using direct DOM manipulation to avoid re-renders
  useFrame(() => {
    if (!labelRef.current) return;
    
    if (!hoveredObject || !labelsVisible) {
      if (lastPositionRef.current?.visible !== false) {
        labelRef.current.style.display = 'none';
        lastPositionRef.current = { x: 0, y: 0, visible: false };
      }
      return;
    }

    const screenPos = projectToScreen(
      hoveredObject.position,
      camera,
      size.width,
      size.height
    );

    if (screenPos.isBehindCamera || screenPos.isOffScreen) {
      if (lastPositionRef.current?.visible !== false) {
        labelRef.current.style.display = 'none';
        lastPositionRef.current = { x: 0, y: 0, visible: false };
      }
    } else {
      const clamped = clampToScreen(screenPos.x, screenPos.y, size.width, size.height);
      const offset = calculateLabelOffset(clamped.x, clamped.y);

      // Only update if position changed significantly (> 1px)
      if (!lastPositionRef.current || 
          Math.abs(lastPositionRef.current.x - offset.x) > 1 || 
          Math.abs(lastPositionRef.current.y - offset.y) > 1 ||
          !lastPositionRef.current.visible) {
        labelRef.current.style.display = 'block';
        labelRef.current.style.left = `${offset.x}px`;
        labelRef.current.style.top = `${offset.y}px`;
        lastPositionRef.current = { x: offset.x, y: offset.y, visible: true };
      }
    }
  });

  if (!hoveredObject || !labelsVisible || !containerRef.current) {
    return null;
  }

  const { name, type, metadata } = hoveredObject;

  // Render label via portal to container outside Canvas
  return createPortal(
    <div
      ref={labelRef}
      className="overlay-label"
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
