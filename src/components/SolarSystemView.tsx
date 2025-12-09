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

'use client';

/**
 * SolarSystemView - Displays a solar system with clickable planets
 * Uses shared PlanetarySystem component for consistency with GalaxyView
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SolarSystem } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import { SOLAR_SYSTEM_VIEW_PLANETARY_SCALE } from '@/lib/universe/scale-constants';
import { PlanetarySystem } from './shared/PlanetarySystem';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG } from '@/lib/animation';
import { useGraphicsConfigReadOnly } from '@/lib/graphics-context';

interface SolarSystemViewProps {
  solarSystem: SolarSystem;
  position: THREE.Vector3;
}

/**
 * Solar system view with orbiting planets
 * Now uses shared PlanetarySystem component with solar system scale preset
 * and config-driven parameters
 */
export default function SolarSystemView({ solarSystem, position }: SolarSystemViewProps) {
  const { navigateToPlanet } = useNavigationStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationConfig = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, prefersReducedMotion);
  const graphicsConfig = useGraphicsConfigReadOnly();

  // Apply graphics config to scale parameters
  const configuredScale = useMemo(() => {
    const baseScale = SOLAR_SYSTEM_VIEW_PLANETARY_SCALE;
    const solarSystemConfig = graphicsConfig.solarSystemView;
    
    return {
      ...baseScale,
      // Apply config-driven orbit stroke width
      orbitRingLineWidth: solarSystemConfig.orbitStrokeWidth ?? baseScale.orbitRingLineWidth,
      // Apply planet scale multiplier
      planetBaseSize: baseScale.planetBaseSize * (solarSystemConfig.planetScaleMultiplier ?? 1.0),
      planetSizeIncrement: baseScale.planetSizeIncrement * (solarSystemConfig.planetScaleMultiplier ?? 1.0),
      // Apply orbital spacing multiplier
      orbitSpacing: baseScale.orbitSpacing * (solarSystemConfig.orbitalSpacing ?? 1.0),
      // Apply star glow intensity to light
      starLightIntensity: baseScale.starLightIntensity * (solarSystemConfig.starGlowIntensity ?? 1.0),
      // Apply camera distance (affects viewport radius)
      viewportRadius: baseScale.viewportRadius 
        ? baseScale.viewportRadius * (solarSystemConfig.cameraDistance ?? 1.0)
        : undefined,
    };
  }, [graphicsConfig.solarSystemView]);

  return (
    <PlanetarySystem
      solarSystem={solarSystem}
      position={position}
      onPlanetClick={(planet) => navigateToPlanet(planet.id)}
      scale={configuredScale}
      animationConfig={animationConfig}
    />
  );
}
