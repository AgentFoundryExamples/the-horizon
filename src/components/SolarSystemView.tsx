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

import * as THREE from 'three';
import type { SolarSystem } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import { SOLAR_SYSTEM_VIEW_PLANETARY_SCALE } from '@/lib/universe/scale-constants';
import { PlanetarySystem } from './shared/PlanetarySystem';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG } from '@/lib/animation';

interface SolarSystemViewProps {
  solarSystem: SolarSystem;
  position: THREE.Vector3;
}

/**
 * Solar system view with orbiting planets
 * Now uses shared PlanetarySystem component with solar system scale preset
 */
export default function SolarSystemView({ solarSystem, position }: SolarSystemViewProps) {
  const { navigateToPlanet } = useNavigationStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationConfig = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, prefersReducedMotion);

  return (
    <PlanetarySystem
      solarSystem={solarSystem}
      position={position}
      onPlanetClick={(planet) => navigateToPlanet(planet.id)}
      scale={SOLAR_SYSTEM_VIEW_PLANETARY_SCALE}
      animationConfig={animationConfig}
    />
  );
}
