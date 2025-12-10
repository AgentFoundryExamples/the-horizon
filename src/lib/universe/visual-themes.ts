/**
 * Visual theme presets and configuration for celestial bodies
 * Provides default values and fallback handling for missing/legacy data
 */

import type { CelestialVisualTheme, StarHaloConfig } from './types';

/**
 * Default visual theme presets for planets and moons
 * These provide sensible defaults when custom configuration is not specified
 */
export const CELESTIAL_THEME_PRESETS: Record<string, CelestialVisualTheme> = {
  rocky: {
    preset: 'rocky',
    glowColor: '#8B7355',
    glowIntensity: 0.2,
    rotationSpeed: 0.8,
  },
  gasGiant: {
    preset: 'gasGiant',
    glowColor: '#FFA500',
    glowIntensity: 0.4,
    rotationSpeed: 1.5,
  },
  icy: {
    preset: 'icy',
    glowColor: '#B0E0E6',
    glowIntensity: 0.3,
    rotationSpeed: 0.6,
  },
  volcanic: {
    preset: 'volcanic',
    glowColor: '#FF4500',
    glowIntensity: 0.5,
    rotationSpeed: 1.0,
  },
  'earth-like': {
    preset: 'earth-like',
    glowColor: '#4A90E2',
    glowIntensity: 0.35,
    rotationSpeed: 1.0,
  },
  'blue-green': {
    preset: 'blue-green',
    glowColor: '#2E86AB',
    glowIntensity: 0.3,
    rotationSpeed: 1.0,
  },
  red: {
    preset: 'red',
    glowColor: '#E63946',
    glowIntensity: 0.25,
    rotationSpeed: 0.9,
  },
  desert: {
    preset: 'desert',
    glowColor: '#D4A574',
    glowIntensity: 0.2,
    rotationSpeed: 0.7,
  },
};

/**
 * Default star halo configurations based on star theme/type
 */
export const STAR_HALO_PRESETS: Record<string, StarHaloConfig> = {
  'yellow-dwarf': {
    haloIntensity: 50,
    color: '#FDB813',
    haloRadius: 1.5,
  },
  'orange-dwarf': {
    haloIntensity: 45,
    color: '#FF8C00',
    haloRadius: 1.4,
  },
  'red-dwarf': {
    haloIntensity: 40,
    color: '#E63946',
    haloRadius: 1.3,
  },
  'blue-giant': {
    haloIntensity: 70,
    color: '#4A90E2',
    haloRadius: 1.8,
  },
  'white-dwarf': {
    haloIntensity: 60,
    color: '#FFFFFF',
    haloRadius: 1.2,
  },
};

/**
 * Resolves a complete celestial visual theme with defaults
 * Merges custom configuration with preset defaults
 * 
 * @param customTheme - Optional custom theme from planet/moon data
 * @param baseTheme - Base theme string (e.g., 'blue-green', 'red') for fallback
 * @returns Complete visual theme configuration with all fields populated
 */
export function resolveCelestialTheme(
  customTheme: CelestialVisualTheme | undefined,
  baseTheme: string
): Required<CelestialVisualTheme> {
  // Start with preset if available
  const preset = customTheme?.preset || baseTheme;
  const presetConfig = CELESTIAL_THEME_PRESETS[preset] || CELESTIAL_THEME_PRESETS['rocky'];
  
  // Merge custom values over preset
  return {
    preset,
    diffuseTexture: customTheme?.diffuseTexture || '',
    normalTexture: customTheme?.normalTexture || '',
    specularTexture: customTheme?.specularTexture || '',
    glowColor: customTheme?.glowColor || presetConfig.glowColor || '#CCCCCC',
    glowIntensity: customTheme?.glowIntensity ?? presetConfig.glowIntensity ?? 0.3,
    rotationSpeed: customTheme?.rotationSpeed ?? presetConfig.rotationSpeed ?? 1.0,
  };
}

/**
 * Resolves a complete star halo configuration with defaults
 * Merges custom configuration with preset defaults based on star theme
 * 
 * @param customHalo - Optional custom halo config from star data
 * @param starTheme - Star theme string for preset selection
 * @returns Complete halo configuration with all fields populated
 */
export function resolveStarHalo(
  customHalo: StarHaloConfig | undefined,
  starTheme: string
): Required<StarHaloConfig> {
  // Find matching preset or use default
  const presetConfig = STAR_HALO_PRESETS[starTheme] || STAR_HALO_PRESETS['yellow-dwarf'];
  
  // Merge custom values over preset
  return {
    haloIntensity: customHalo?.haloIntensity ?? presetConfig.haloIntensity ?? 50,
    texture: customHalo?.texture || '',
    color: customHalo?.color || presetConfig.color || '#FDB813',
    haloRadius: customHalo?.haloRadius ?? presetConfig.haloRadius ?? 1.5,
  };
}

/**
 * Clamps halo intensity to valid range (0-100)
 */
export function clampHaloIntensity(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Clamps glow intensity to valid range (0-1)
 */
export function clampGlowIntensity(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Clamps rotation speed to valid range (0.1-3.0)
 * Prevents negative or extremely fast rotations
 */
export function clampRotationSpeed(value: number): number {
  return Math.max(0.1, Math.min(3.0, value));
}

/**
 * Clamps halo radius to valid range (1.0-3.0)
 */
export function clampHaloRadius(value: number): number {
  return Math.max(1.0, Math.min(3.0, value));
}

/**
 * Validates and returns a hex color, with fallback
 */
export function validateHexColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  
  // Check if valid hex color format
  const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  return hexRegex.test(color) ? color : fallback;
}
