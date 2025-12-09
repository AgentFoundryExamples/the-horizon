'use client';

/**
 * Label configuration for per-scene hover labels
 * Defines styling and positioning for hover labels based on active scene
 */

import type { FocusLevel } from './store';

export interface LabelConfig {
  /** Font size for the label name/title */
  fontSize: string;
  /** Font size for the label type */
  typeFontSize: string;
  /** Vertical offset from the hovered object (in pixels) */
  offsetY: number;
  /** Distance factor for Html component (affects scaling with distance) */
  distanceFactor: number;
  /** Optional: minimum width for label content */
  minWidth?: string;
  /** Optional: maximum width for label content */
  maxWidth?: string;
  /** Optional: background opacity (0-1) */
  backgroundOpacity?: number;
  /** Optional: border color override */
  borderColor?: string;
  /** Optional: enable/disable glow effect */
  enableGlow?: boolean;
  /** Optional: text wrapping behavior */
  textWrap?: 'nowrap' | 'wrap';
}

/**
 * Default label configuration for each scene type
 * Universe: Large labels for distant galaxies
 * Galaxy: Medium labels for solar systems
 * Solar System: Standard labels for planets
 * Planet: Smaller, compact labels for moons
 */
export const LABEL_CONFIGS: Record<FocusLevel, LabelConfig> = {
  universe: {
    fontSize: '1.1rem',
    typeFontSize: '0.85rem',
    offsetY: 25,
    distanceFactor: 150, // Larger for better readability at distance
    minWidth: '140px',
    maxWidth: '320px',
    backgroundOpacity: 0.9,
    enableGlow: true,
    textWrap: 'nowrap',
  },
  galaxy: {
    fontSize: '1rem',
    typeFontSize: '0.8rem',
    offsetY: 22,
    distanceFactor: 120,
    minWidth: '130px',
    maxWidth: '300px',
    backgroundOpacity: 0.88,
    enableGlow: true,
    textWrap: 'nowrap',
  },
  'solar-system': {
    fontSize: '0.95rem',
    typeFontSize: '0.75rem',
    offsetY: 20,
    distanceFactor: 100, // Standard scaling
    minWidth: '120px',
    maxWidth: '300px',
    backgroundOpacity: 0.85,
    enableGlow: true,
    textWrap: 'nowrap',
  },
  planet: {
    fontSize: '0.9rem',
    typeFontSize: '0.7rem',
    offsetY: 18,
    distanceFactor: 80, // Smaller for closer objects
    minWidth: '110px',
    maxWidth: '280px',
    backgroundOpacity: 0.85,
    enableGlow: false, // Subtle for close-up view
    textWrap: 'wrap', // Allow wrapping for moon names
  },
};

/**
 * Get label configuration for the current scene
 * Falls back to solar-system config if scene is not recognized
 * (solar-system provides a balanced middle-ground configuration)
 */
export function getLabelConfig(focusLevel: FocusLevel): LabelConfig {
  return LABEL_CONFIGS[focusLevel] || LABEL_CONFIGS['solar-system'];
}

/**
 * Merge custom label configuration with defaults
 * Useful for admin overrides or user preferences
 */
export function mergeLabelConfig(
  base: LabelConfig,
  overrides: Partial<LabelConfig>
): LabelConfig {
  return {
    ...base,
    ...overrides,
  };
}
