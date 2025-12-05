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
 * Animation utilities and configuration
 * Handles prefers-reduced-motion detection and animation intensity controls
 */

import { useEffect, useState } from 'react';

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  /** Enable rotation animations */
  rotation: boolean;
  /** Rotation speed multiplier (0-1) */
  rotationSpeed: number;
  /** Enable parallax effects */
  parallax: boolean;
  /** Enable particle drift */
  particleDrift: boolean;
  /** Particle drift speed multiplier (0-1) */
  driftSpeed: number;
  /** Animation intensity (0-1) */
  intensity: number;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  rotation: true,
  rotationSpeed: 1.0,
  parallax: true,
  particleDrift: true,
  driftSpeed: 1.0,
  intensity: 1.0,
};

/**
 * Hook to detect prefers-reduced-motion setting
 * Returns true if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation configuration based on user preferences
 * @param config - Base configuration
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Adjusted configuration
 */
export function getAnimationConfig(
  config: AnimationConfig,
  prefersReducedMotion: boolean
): AnimationConfig {
  if (prefersReducedMotion) {
    return {
      rotation: false,
      rotationSpeed: 0,
      parallax: false,
      particleDrift: false,
      driftSpeed: 0,
      intensity: 0,
    };
  }
  return config;
}

/**
 * Calculate animation intensity based on performance metrics
 * @param fps - Current frames per second
 * @param targetFps - Target FPS (default: 60)
 * @returns Intensity multiplier (0-1)
 */
export function calculateAnimationIntensity(fps: number, targetFps: number = 60): number {
  if (fps >= targetFps) {
    return 1.0;
  }
  
  // Reduce intensity if FPS drops below target
  const ratio = fps / targetFps;
  
  // If FPS drops below 30, reduce to minimum
  if (fps < 30) {
    return 0.3;
  }
  
  // Gradual reduction between 30 and target FPS
  return Math.max(0.3, Math.min(1.0, ratio));
}

/**
 * Hook to track FPS and automatically adjust animation intensity
 * @returns Current FPS and recommended intensity
 */
export function useAnimationPerformance() {
  const [fps, setFps] = useState(60);
  const [intensity, setIntensity] = useState(1.0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      // Update FPS every second
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        setFps(currentFps);
        setIntensity(calculateAnimationIntensity(currentFps));
        
        frameCount = 0;
        lastTime = currentTime;
      }

      rafId = requestAnimationFrame(measureFps);
    };

    rafId = requestAnimationFrame(measureFps);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return { fps, intensity };
}
