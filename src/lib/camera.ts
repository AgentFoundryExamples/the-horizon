// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * Camera animation utilities with easing functions
 * Provides smooth transitions for camera movements
 */

import * as THREE from 'three';

/**
 * Easing function for smooth camera transitions
 * Uses cubic ease-in-out for natural motion
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Easing function with smoother acceleration
 * Uses quintic ease-in-out
 */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Spherical linear interpolation for smooth rotation
 */
export function slerp(
  start: THREE.Quaternion,
  end: THREE.Quaternion,
  t: number
): THREE.Quaternion {
  return start.clone().slerp(end, t);
}

/**
 * Camera position configuration for different focus levels
 */
export interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  rotation?: THREE.Quaternion;
}

/**
 * Default camera positions for different focus levels
 */
export const DEFAULT_CAMERA_POSITIONS = {
  universe: {
    position: new THREE.Vector3(0, 50, 100),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  galaxy: {
    position: new THREE.Vector3(0, 20, 40),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  solarSystem: {
    position: new THREE.Vector3(0, 10, 25),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
};

/**
 * Animation parameters for camera transitions
 */
export interface AnimationConfig {
  duration: number; // in milliseconds
  easing: (t: number) => number;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 1500, // 1.5 seconds
  easing: easeInOutCubic,
};

/**
 * Calculates camera position for focusing on a specific object
 */
export function calculateFocusPosition(
  targetPosition: THREE.Vector3,
  distance: number,
  angle: number = 45 // degrees
): CameraPosition {
  const angleRad = (angle * Math.PI) / 180;
  
  return {
    position: new THREE.Vector3(
      targetPosition.x + distance * Math.sin(angleRad),
      targetPosition.y + distance * 0.5,
      targetPosition.z + distance * Math.cos(angleRad)
    ),
    lookAt: targetPosition.clone(),
  };
}

/**
 * Creates a spline path for camera movement
 */
export function createCameraPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  curveHeight: number = 10
): THREE.CatmullRomCurve3 {
  const midPoint = new THREE.Vector3(
    (start.x + end.x) / 2,
    Math.max(start.y, end.y) + curveHeight,
    (start.z + end.z) / 2
  );

  return new THREE.CatmullRomCurve3([start, midPoint, end]);
}

/**
 * Animates camera along a path
 */
export class CameraAnimator {
  private startTime: number | null = null;
  private startPosition: THREE.Vector3;
  private endPosition: THREE.Vector3;
  private startLookAt: THREE.Vector3;
  private endLookAt: THREE.Vector3;
  private config: AnimationConfig;
  private onComplete?: () => void;
  private path?: THREE.CatmullRomCurve3;

  constructor(
    from: CameraPosition,
    to: CameraPosition,
    config: AnimationConfig = DEFAULT_ANIMATION_CONFIG,
    usePath: boolean = false
  ) {
    this.startPosition = from.position.clone();
    this.endPosition = to.position.clone();
    this.startLookAt = from.lookAt.clone();
    this.endLookAt = to.lookAt.clone();
    this.config = config;

    if (usePath) {
      this.path = createCameraPath(this.startPosition, this.endPosition);
    }
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Update camera position based on elapsed time
   * Returns true if animation is complete
   */
  update(camera: THREE.Camera, currentTime: number): boolean {
    if (this.startTime === null) {
      this.startTime = currentTime;
    }

    const elapsed = currentTime - this.startTime;
    const t = Math.min(elapsed / this.config.duration, 1);
    const easedT = this.config.easing(t);

    // Update position
    if (this.path) {
      const pathPosition = this.path.getPoint(easedT);
      camera.position.copy(pathPosition);
    } else {
      camera.position.lerpVectors(this.startPosition, this.endPosition, easedT);
    }

    // Update look-at target
    const currentLookAt = new THREE.Vector3().lerpVectors(
      this.startLookAt,
      this.endLookAt,
      easedT
    );
    camera.lookAt(currentLookAt);

    // Check if animation is complete
    if (t >= 1) {
      if (this.onComplete) {
        this.onComplete();
      }
      return true;
    }

    return false;
  }

  /**
   * Reset animation
   */
  reset(): void {
    this.startTime = null;
  }
}

/**
 * Constrains camera position to prevent extreme values
 */
export function constrainCamera(
  position: THREE.Vector3,
  minDistance: number = 5,
  maxDistance: number = 200
): THREE.Vector3 {
  const distance = position.length();
  
  if (distance < minDistance) {
    return position.clone().normalize().multiplyScalar(minDistance);
  }
  
  if (distance > maxDistance) {
    return position.clone().normalize().multiplyScalar(maxDistance);
  }
  
  // Return original position if within bounds to avoid unnecessary cloning
  return position;
}
