/**
 * Planet Layout Configuration Utilities
 * Provides safe defaults and validation for planet viewer layout customization
 */

import type { PlanetLayoutConfig } from './types';

/**
 * Default layout configuration for Planet Viewer
 * These values provide a balanced, portfolio-ready layout
 */
export const DEFAULT_PLANET_LAYOUT: Required<PlanetLayoutConfig> = {
  planetColumnWidth: 30,
  planetRenderScale: 1.0,
  planetOffsetX: 0,
  planetOffsetY: 0,
  contentPadding: 2,
  contentMaxWidth: 800,
};

/**
 * Safe ranges for configuration values
 * Values outside these ranges will be clamped
 */
export const LAYOUT_RANGES = {
  planetColumnWidth: { min: 20, max: 50 },
  planetRenderScale: { min: 0.5, max: 2.0 },
  planetOffsetX: { min: -50, max: 50 },
  planetOffsetY: { min: -50, max: 50 },
  contentPadding: { min: 1, max: 4 },
  contentMaxWidth: { min: 600, max: 1200 },
};

/**
 * Clamps a number to a safe range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalizes and validates layout configuration
 * Clamps all values to safe ranges and provides defaults for missing values
 * 
 * @param config - Partial configuration from planet metadata
 * @param globalConfig - Optional global defaults to override system defaults
 * @returns Fully populated and validated configuration
 */
export function normalizePlanetLayout(
  config?: PlanetLayoutConfig,
  globalConfig?: PlanetLayoutConfig
): Required<PlanetLayoutConfig> {
  // Merge: config > globalConfig > defaults
  const merged = {
    ...DEFAULT_PLANET_LAYOUT,
    ...globalConfig,
    ...config,
  };

  // Clamp all values to safe ranges
  return {
    planetColumnWidth: clamp(
      merged.planetColumnWidth,
      LAYOUT_RANGES.planetColumnWidth.min,
      LAYOUT_RANGES.planetColumnWidth.max
    ),
    planetRenderScale: clamp(
      merged.planetRenderScale,
      LAYOUT_RANGES.planetRenderScale.min,
      LAYOUT_RANGES.planetRenderScale.max
    ),
    planetOffsetX: clamp(
      merged.planetOffsetX,
      LAYOUT_RANGES.planetOffsetX.min,
      LAYOUT_RANGES.planetOffsetX.max
    ),
    planetOffsetY: clamp(
      merged.planetOffsetY,
      LAYOUT_RANGES.planetOffsetY.min,
      LAYOUT_RANGES.planetOffsetY.max
    ),
    contentPadding: clamp(
      merged.contentPadding,
      LAYOUT_RANGES.contentPadding.min,
      LAYOUT_RANGES.contentPadding.max
    ),
    contentMaxWidth: clamp(
      merged.contentMaxWidth,
      LAYOUT_RANGES.contentMaxWidth.min,
      LAYOUT_RANGES.contentMaxWidth.max
    ),
  };
}

/**
 * Validates if a layout configuration is within safe ranges
 * Returns an array of warning messages for out-of-range values
 * 
 * @param config - Configuration to validate
 * @returns Array of warning messages (empty if all valid)
 */
export function validateLayoutConfig(config: PlanetLayoutConfig): string[] {
  const warnings: string[] = [];

  // Iterate through each configuration key and validate against its range
  for (const key in LAYOUT_RANGES) {
    const configKey = key as keyof PlanetLayoutConfig;
    const value = config[configKey];
    
    if (value !== undefined) {
      const { min, max } = LAYOUT_RANGES[configKey];
      if (value < min || value > max) {
        warnings.push(`${configKey} ${value} is outside safe range [${min}, ${max}]. Value will be clamped.`);
      }
    }
  }

  return warnings;
}

/**
 * Generates CSS custom properties from layout configuration
 * These can be applied to the planet surface container
 * 
 * @param config - Normalized layout configuration
 * @returns CSS custom properties object
 */
export function layoutConfigToCSS(config: Required<PlanetLayoutConfig>): Record<string, string> {
  return {
    '--planet-column-width': `${config.planetColumnWidth}%`,
    '--planet-render-scale': `${config.planetRenderScale}`,
    '--planet-offset-x': `${config.planetOffsetX}%`,
    '--planet-offset-y': `${config.planetOffsetY}%`,
    '--content-padding': `${config.contentPadding}rem`,
    '--content-max-width': `${config.contentMaxWidth}px`,
  };
}
