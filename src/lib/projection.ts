'use client';

/**
 * 3D to 2D screen projection utilities for overlay labels
 * Converts world coordinates to screen coordinates with clamping
 */

import * as THREE from 'three';

export interface ScreenPosition {
  x: number;
  y: number;
  isOffScreen: boolean;
  isBehindCamera: boolean;
}

const EDGE_MARGIN = 50; // Pixels from screen edge for clamping

/**
 * Project a 3D world position to 2D screen coordinates
 * Returns normalized device coordinates (-1 to 1) converted to pixel space
 */
export function projectToScreen(
  position: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number
): ScreenPosition {
  // Validate dimensions to prevent division by zero or invalid calculations
  if (width <= 0 || height <= 0) {
    return {
      x: 0,
      y: 0,
      isOffScreen: true,
      isBehindCamera: false,
    };
  }
  
  // Create a copy to avoid modifying the original
  const pos = position.clone();
  
  // Project to normalized device coordinates
  pos.project(camera);
  
  // Check if behind camera
  const isBehindCamera = pos.z > 1;
  
  // Convert from NDC (-1 to 1) to pixel coordinates
  const x = (pos.x * 0.5 + 0.5) * width;
  const y = (-pos.y * 0.5 + 0.5) * height; // Flip Y axis
  
  // Check if off-screen (with margin)
  const isOffScreen =
    x < -EDGE_MARGIN ||
    x > width + EDGE_MARGIN ||
    y < -EDGE_MARGIN ||
    y > height + EDGE_MARGIN ||
    isBehindCamera;
  
  return {
    x,
    y,
    isOffScreen,
    isBehindCamera,
  };
}

/**
 * Clamp position to stay within screen bounds with margin
 */
export function clampToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number = EDGE_MARGIN
): { x: number; y: number; clamped: boolean } {
  const originalX = x;
  const originalY = y;
  
  const clampedX = Math.max(margin, Math.min(width - margin, x));
  const clampedY = Math.max(margin, Math.min(height - margin, y));
  
  const clamped = clampedX !== originalX || clampedY !== originalY;
  
  return {
    x: clampedX,
    y: clampedY,
    clamped,
  };
}

/**
 * Calculate offset position for label to avoid overlapping with target
 * Returns an offset that positions the label near the target
 */
export function calculateLabelOffset(
  baseX: number,
  baseY: number,
  offsetX: number = 20,
  offsetY: number = -30
): { x: number; y: number } {
  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
  };
}

/**
 * Check if two screen positions are too close (for clustering)
 */
export function arePositionsTooClose(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  threshold: number = 100
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < threshold;
}
