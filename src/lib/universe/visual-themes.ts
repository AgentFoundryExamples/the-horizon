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
): CelestialVisualTheme & { glowColor: string; glowIntensity: number; rotationSpeed: number } {
  // Start with preset if available
  const preset = customTheme?.preset || baseTheme;
  const presetConfig = CELESTIAL_THEME_PRESETS[preset] || CELESTIAL_THEME_PRESETS['rocky'];
  
  // Validate and merge custom values over preset with proper type checking
  const glowColor = validateHexColor(
    customTheme?.glowColor,
    presetConfig.glowColor || '#CCCCCC'
  );
  
  const glowIntensity = validateNumber(
    customTheme?.glowIntensity,
    0,
    1,
    presetConfig.glowIntensity ?? 0.3
  );
  
  const rotationSpeed = validateNumber(
    customTheme?.rotationSpeed,
    0.1,
    3.0,
    presetConfig.rotationSpeed ?? 1.0
  );
  
  // Validate texture URLs for security
  const diffuseTexture = validateTextureUrl(customTheme?.diffuseTexture);
  const normalTexture = validateTextureUrl(customTheme?.normalTexture);
  const specularTexture = validateTextureUrl(customTheme?.specularTexture);
  
  return {
    preset,
    diffuseTexture,
    normalTexture,
    specularTexture,
    glowColor,
    glowIntensity,
    rotationSpeed,
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
): StarHaloConfig & { haloIntensity: number; color: string; haloRadius: number } {
  // Find matching preset or use default
  const presetConfig = STAR_HALO_PRESETS[starTheme] || STAR_HALO_PRESETS['yellow-dwarf'];
  
  // Validate and merge custom values over preset with proper type checking
  const haloIntensity = validateNumber(
    customHalo?.haloIntensity,
    0,
    100,
    presetConfig.haloIntensity ?? 50
  );
  
  const color = validateHexColor(
    customHalo?.color,
    presetConfig.color || '#FDB813'
  );
  
  const haloRadius = validateNumber(
    customHalo?.haloRadius,
    1.0,
    3.0,
    presetConfig.haloRadius ?? 1.5
  );
  
  // Validate texture URL for security
  const texture = validateTextureUrl(customHalo?.texture);
  
  return {
    haloIntensity,
    texture,
    color,
    haloRadius,
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

/**
 * Validates a numeric value is within safe range
 * Returns the value if valid, otherwise returns the fallback
 */
export function validateNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates a texture URL for security (SSRF protection)
 * Only allows relative paths or same-origin URLs
 */
export function validateTextureUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // Allow relative paths starting with /
  if (url.startsWith('/')) {
    // Basic path traversal protection
    if (url.includes('..')) {
      console.warn('Path traversal attempt detected in texture URL:', url);
      return undefined;
    }
    return url;
  }
  
  // For absolute URLs, only allow http/https and check if same origin
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      console.warn('Invalid protocol in texture URL:', url);
      return undefined;
    }
    // In browser environment, check same origin
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      if (parsedUrl.origin !== currentOrigin) {
        console.warn('Cross-origin texture URL blocked:', url);
        return undefined;
      }
    }
    return url;
  } catch (e) {
    console.warn('Invalid texture URL:', url);
    return undefined;
  }
}
