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
 * Graphics Presets
 * 
 * Provides default GraphicsConfig and named PlanetMaterial presets
 * for different planet types and visual styles.
 */

import { GraphicsConfig, PlanetMaterial } from './config';

/**
 * Rocky planet material preset
 * Earth-like terrestrial worlds with solid surfaces
 */
export const ROCKY_PLANET: PlanetMaterial = {
  id: 'rocky',
  name: 'Rocky Planet',
  description: 'Terrestrial planet with a solid rocky surface, suitable for Earth-like worlds',
  baseColor: '#8B7355',
  rimColor: '#FFD700',
  rimIntensity: 0.6,
  atmosphereColor: '#87CEEB',
  atmosphereIntensity: 0.4,
  toonShading: false,
  texturePreset: {
    name: 'rocky-default',
    baseTexturePath: '/textures/planets/rocky_base.jpg',
    normalMapPath: '/textures/planets/rocky_normal.jpg',
  },
  roughness: 0.8,
  metallic: 0.1,
  proceduralNoise: true,
};

/**
 * Gas giant material preset
 * Jupiter-like massive planets with thick atmospheres
 */
export const GAS_GIANT: PlanetMaterial = {
  id: 'gas-giant',
  name: 'Gas Giant',
  description: 'Massive planet with thick atmospheric bands and swirling storms',
  baseColor: '#D4A574',
  rimColor: '#FFA500',
  rimIntensity: 0.8,
  atmosphereColor: '#FFE4B5',
  atmosphereIntensity: 0.7,
  toonShading: false,
  texturePreset: {
    name: 'gas-giant-default',
    baseTexturePath: '/textures/planets/gas_giant_base.jpg',
    normalMapPath: '/textures/planets/gas_giant_normal.jpg',
  },
  roughness: 0.3,
  metallic: 0.0,
  proceduralNoise: true,
};

/**
 * Ice world material preset
 * Frozen planets with icy surfaces
 */
export const ICE_WORLD: PlanetMaterial = {
  id: 'ice-world',
  name: 'Ice World',
  description: 'Frozen planet with glacial ice and snowy surfaces',
  baseColor: '#C8E6F5',
  rimColor: '#FFFFFF',
  rimIntensity: 1.0,
  atmosphereColor: '#B0E0E6',
  atmosphereIntensity: 0.5,
  toonShading: false,
  texturePreset: {
    name: 'ice-world-default',
    baseTexturePath: '/textures/planets/ice_base.jpg',
    normalMapPath: '/textures/planets/ice_normal.jpg',
    specularMapPath: '/textures/planets/ice_specular.jpg',
  },
  roughness: 0.2,
  metallic: 0.3,
  proceduralNoise: true,
};

/**
 * Volcanic planet material preset
 * Lava-covered worlds with extreme temperatures
 */
export const VOLCANIC_PLANET: PlanetMaterial = {
  id: 'volcanic',
  name: 'Volcanic Planet',
  description: 'Hellish world with molten lava flows and volcanic activity',
  baseColor: '#2B1810',
  rimColor: '#FF4500',
  rimIntensity: 1.5,
  atmosphereColor: '#FF6347',
  atmosphereIntensity: 0.9,
  toonShading: false,
  texturePreset: {
    name: 'volcanic-default',
    baseTexturePath: '/textures/planets/volcanic_base.jpg',
    normalMapPath: '/textures/planets/volcanic_normal.jpg',
  },
  roughness: 0.9,
  metallic: 0.0,
  proceduralNoise: true,
};

/**
 * Oceanic planet material preset
 * Water-covered worlds with deep oceans
 */
export const OCEANIC_PLANET: PlanetMaterial = {
  id: 'oceanic',
  name: 'Oceanic Planet',
  description: 'Water world with vast oceans covering the entire surface',
  baseColor: '#1E90FF',
  rimColor: '#00CED1',
  rimIntensity: 0.7,
  atmosphereColor: '#87CEFA',
  atmosphereIntensity: 0.6,
  toonShading: false,
  texturePreset: {
    name: 'oceanic-default',
    baseTexturePath: '/textures/planets/oceanic_base.jpg',
    normalMapPath: '/textures/planets/oceanic_normal.jpg',
    specularMapPath: '/textures/planets/oceanic_specular.jpg',
  },
  roughness: 0.1,
  metallic: 0.0,
  proceduralNoise: true,
};

/**
 * All planet material presets indexed by ID
 */
export const PLANET_MATERIAL_PRESETS: Record<string, PlanetMaterial> = {
  rocky: ROCKY_PLANET,
  'gas-giant': GAS_GIANT,
  'ice-world': ICE_WORLD,
  volcanic: VOLCANIC_PLANET,
  oceanic: OCEANIC_PLANET,
};

/**
 * Default graphics configuration
 * Provides sensible defaults for all rendering settings
 */
export const DEFAULT_GRAPHICS_CONFIG: GraphicsConfig = {
  version: '1.0.0',
  
  universe: {
    globalScaleMultiplier: 1.0,
    backgroundStarDensity: 0.5,
    lowPowerMode: false,
    fallbackQuality: 2,
    antiAliasing: true,
    shadowQuality: 1,
  },
  
  galaxyView: {
    galaxyOpacity: 0.7,
    starBrightness: 1.0,
    starDensity: 1.0,
    rotationSpeed: 1.0,
    cameraZoom: 1.0,
    hoverLabels: {
      enabled: true,
      fontSize: 14,
      backgroundOpacity: 0.85,
      visibilityDistance: 50,
      showDelay: 200,
    },
  },
  
  solarSystemView: {
    orbitStrokeWidth: 1.5,
    planetScaleMultiplier: 1.0,
    orbitAnimationSpeed: 1.0,
    starGlowIntensity: 1.0,
    orbitalSpacing: 1.0,
    cameraDistance: 1.0,
    hoverLabels: {
      enabled: true,
      fontSize: 14,
      backgroundOpacity: 0.85,
      visibilityDistance: 50,
      showDelay: 200,
    },
  },
  
  planetView: {
    planetRenderScale: 1.0,
    rotationSpeed: 1.0,
    atmosphereGlow: 1.0,
    cloudOpacity: 0.6,
    lightingIntensity: 1.0,
    rimLighting: true,
    hoverLabels: {
      enabled: true,
      fontSize: 14,
      backgroundOpacity: 0.85,
      visibilityDistance: 50,
      showDelay: 200,
    },
  },
  
  planetMaterials: PLANET_MATERIAL_PRESETS,
};

/**
 * Get a planet material preset by ID
 * Returns undefined if preset doesn't exist
 */
export function getPlanetMaterialPreset(id: string): PlanetMaterial | undefined {
  return PLANET_MATERIAL_PRESETS[id];
}

/**
 * Get all available planet material preset IDs
 */
export function getPlanetMaterialPresetIds(): string[] {
  return Object.keys(PLANET_MATERIAL_PRESETS);
}

/**
 * Check if a planet material preset exists
 */
export function hasPlanetMaterialPreset(id: string): boolean {
  return id in PLANET_MATERIAL_PRESETS;
}

/**
 * Create a custom planet material by extending an existing preset
 * Returns undefined if the base preset doesn't exist
 */
export function createCustomPlanetMaterial(
  basePresetId: string,
  overrides: Partial<PlanetMaterial>,
  newId: string,
  newName: string
): PlanetMaterial | undefined {
  const basePreset = getPlanetMaterialPreset(basePresetId);
  if (!basePreset) {
    return undefined;
  }
  
  return {
    ...basePreset,
    ...overrides,
    id: newId,
    name: newName,
  };
}
