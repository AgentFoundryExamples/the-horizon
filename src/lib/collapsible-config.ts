/**
 * Configuration for collapsible sections in the content viewer
 * Controls default behavior, sizing, and interaction parameters
 */

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
    collapsedHeight: Math.max(3, Math.min(8, merged.collapsedHeight)),
    expandedHeight: Math.max(15, Math.min(40, merged.expandedHeight)),
    transitionDuration: Math.max(150, Math.min(500, merged.transitionDuration)),
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
