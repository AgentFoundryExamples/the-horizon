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
 * Label configuration for per-scene hover labels
 * Defines styling and positioning for hover labels based on active scene
 * Now integrates with GraphicsConfig for admin-configurable settings
 */

import type { FocusLevel } from './store';
import type { HoverLabelConfig } from './graphics/config';

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
  return LABEL_CONFIGS[focusLevel] ?? LABEL_CONFIGS['solar-system'];
}

/**
 * Apply HoverLabelConfig from GraphicsConfig to LabelConfig
 * Merges admin-configurable settings with base label configuration
 */
export function applyHoverLabelConfig(
  base: LabelConfig,
  hoverConfig?: HoverLabelConfig
): LabelConfig {
  if (!hoverConfig) return base;

  return {
    ...base,
    fontSize: hoverConfig.fontSize ? `${hoverConfig.fontSize}px` : base.fontSize,
    backgroundOpacity: hoverConfig.backgroundOpacity ?? base.backgroundOpacity,
    // Note: visibilityDistance and showDelay are not used in LabelConfig
    // They would be used in hover detection logic (future enhancement)
  };
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
