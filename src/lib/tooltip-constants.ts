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
 * Shared tooltip styling constants for consistent hover labels across all scenes
 */

/**
 * Standard tooltip typography settings
 */
export const TOOLTIP_TYPOGRAPHY = {
  /** Base font size for tooltip text - increased for better readability */
  FONT_SIZE: '1.25rem',
  /** Font weight for object names */
  FONT_WEIGHT: 'bold',
  /** Subtitle/detail font size (smaller) - increased for better readability */
  SUBTITLE_FONT_SIZE: '1rem',
  /** Maximum width for tooltip content */
  MAX_WIDTH: '350px',
} as const;

/**
 * Standard tooltip positioning settings
 */
export const TOOLTIP_POSITIONING = {
  /** Default vertical offset above object (negative = up) */
  OFFSET_Y: -40,
  /** Default horizontal offset */
  OFFSET_X: 0,
  /** Distance factor for 3D tooltips at universe view (far zoom) */
  DISTANCE_FACTOR_FAR: 50,
  /** Distance factor for 3D tooltips at galaxy view (medium zoom) */
  DISTANCE_FACTOR_MEDIUM: 30,
  /** Distance factor for 3D tooltips at solar system view (close zoom) */
  DISTANCE_FACTOR_CLOSE: 10,
} as const;

/**
 * Standard tooltip color settings
 */
export const TOOLTIP_COLORS = {
  /** Default border color (blue accent) - increased opacity for stronger contrast */
  BORDER_COLOR: 'rgba(74, 144, 226, 0.9)',
  /** Star/solar system border color (gold) - increased opacity for stronger contrast */
  STAR_BORDER_COLOR: 'rgba(251, 184, 19, 0.9)',
  /** Background color (nearly opaque black) */
  BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.95)',
  /** Text color (pure white) */
  TEXT_COLOR: '#FFFFFF',
} as const;

/**
 * Standard tooltip padding settings
 */
export const TOOLTIP_PADDING = {
  /** Default padding - increased for better touch targets and readability */
  DEFAULT: '1rem 1.5rem',
  /** Smaller padding for compact tooltips */
  COMPACT: '0.75rem 1rem',
} as const;
