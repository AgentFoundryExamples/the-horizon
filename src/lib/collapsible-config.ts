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
 * Configuration for collapsible sections in the content viewer
 * Controls default behavior, sizing, and interaction parameters
 */

// Validation constants
const MIN_COLLAPSED_HEIGHT = 3;
const MAX_COLLAPSED_HEIGHT = 8;
const MIN_EXPANDED_HEIGHT = 15;
const MAX_EXPANDED_HEIGHT = 40;
const MIN_TRANSITION_DURATION = 150;
const MAX_TRANSITION_DURATION = 500;

export interface CollapsibleSectionConfig {
  /**
   * Default collapsed state when section first renders
   * Default: true (collapsed)
   */
  defaultCollapsed?: boolean;
  
  /**
   * Maximum height when collapsed (in rem units)
   * Must be < 15% of typical viewport (approx 8rem for 1080p screens)
   * Range: 3-8 rem
   * Default: 5
   */
  collapsedHeight?: number;
  
  /**
   * Maximum height when expanded (in rem units)
   * Range: 15-40 rem
   * Default: 25
   */
  expandedHeight?: number;
  
  /**
   * Transition duration in milliseconds
   * Range: 150-500 ms
   * Default: 300
   */
  transitionDuration?: number;
  
  /**
   * Show item count badge when collapsed
   * Default: true
   */
  showItemCount?: boolean;
}

/**
 * Default configuration for collapsible sections
 */
export const DEFAULT_COLLAPSIBLE_CONFIG: Required<CollapsibleSectionConfig> = {
  defaultCollapsed: true,
  collapsedHeight: 5,
  expandedHeight: 25,
  transitionDuration: 300,
  showItemCount: true,
};

/**
 * Normalize and clamp configuration values to safe ranges
 */
export function normalizeCollapsibleConfig(
  config?: CollapsibleSectionConfig
): Required<CollapsibleSectionConfig> {
  const merged = { ...DEFAULT_COLLAPSIBLE_CONFIG, ...config };
  
  return {
    defaultCollapsed: merged.defaultCollapsed,
    collapsedHeight: Math.max(MIN_COLLAPSED_HEIGHT, Math.min(MAX_COLLAPSED_HEIGHT, merged.collapsedHeight)),
    expandedHeight: Math.max(MIN_EXPANDED_HEIGHT, Math.min(MAX_EXPANDED_HEIGHT, merged.expandedHeight)),
    transitionDuration: Math.max(MIN_TRANSITION_DURATION, Math.min(MAX_TRANSITION_DURATION, merged.transitionDuration)),
    showItemCount: merged.showItemCount,
  };
}

/**
 * Convert configuration to CSS custom properties
 */
export function collapsibleConfigToCSS(
  config: Required<CollapsibleSectionConfig>
): Record<string, string> {
  return {
    '--collapsible-collapsed-height': `${config.collapsedHeight}rem`,
    '--collapsible-expanded-height': `${config.expandedHeight}rem`,
    '--collapsible-transition-duration': `${config.transitionDuration}ms`,
  };
}
