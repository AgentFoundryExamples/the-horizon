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
