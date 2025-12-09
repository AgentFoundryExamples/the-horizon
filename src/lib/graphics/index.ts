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
 * Graphics Module - Main Export
 * 
 * Provides centralized access to graphics configuration, presets, and utilities.
 */

// Core types and interfaces
export type {
  GraphicsConfig,
  UniverseConfig,
  GalaxyViewConfig,
  SolarSystemViewConfig,
  PlanetViewConfig,
  HoverLabelConfig,
  TexturePreset,
  PlanetMaterial,
  ValidationResult,
} from './config';

// Validation and serialization functions
export {
  validateGraphicsConfig,
  validatePlanetMaterial,
  sanitizeGraphicsConfig,
  serializeGraphicsConfig,
  deserializeGraphicsConfig,
} from './config';

// Presets and defaults
export {
  DEFAULT_GRAPHICS_CONFIG,
  PLANET_MATERIAL_PRESETS,
  ROCKY_PLANET,
  GAS_GIANT,
  ICE_WORLD,
  VOLCANIC_PLANET,
  OCEANIC_PLANET,
  getPlanetMaterialPreset,
  getPlanetMaterialPresetIds,
  hasPlanetMaterialPreset,
  createCustomPlanetMaterial,
} from './presets';

// Material system
export type { DeviceCapabilities, PlanetShaderMaterialOptions } from './materials';
export {
  detectDeviceCapabilities,
  createPlanetShaderMaterial,
  createFallbackMaterial,
  createAtmosphereShell,
  applyPlanetMaterial,
  mapThemeToMaterialPreset,
  clonePlanetMaterial,
  clampAnimationMultiplier,
} from './materials';
