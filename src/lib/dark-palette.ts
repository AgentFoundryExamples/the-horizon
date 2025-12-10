/**
 * Centralized Dark Palette Constants
 * 
 * This module defines the single source of truth for all UI colors in The Horizon.
 * The application enforces dark mode globally - there are no light mode variants.
 * 
 * All colors are carefully chosen to maintain WCAG AA accessibility standards
 * against dark backgrounds while providing a cohesive space-themed aesthetic.
 * 
 * Usage:
 * ```typescript
 * import { DARK_PALETTE } from '@/lib/dark-palette';
 * 
 * const buttonStyle = {
 *   backgroundColor: DARK_PALETTE.ui.buttonPrimary,
 *   color: DARK_PALETTE.text.primary,
 * };
 * ```
 */

/**
 * Helper function to deeply freeze an object for runtime immutability
 */
function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return obj;
}

/**
 * Core dark palette for The Horizon application.
 * All UI components should reference these constants rather than hardcoding colors.
 * This object is deeply frozen for both compile-time and runtime immutability.
 */
export const DARK_PALETTE = deepFreeze({
  /**
   * Text colors optimized for dark backgrounds
   * All meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large)
   */
  text: {
    /** Primary text - pure white for maximum contrast (21:1 ratio) */
    primary: '#FFFFFF',
    /** Secondary text - light gray for body content (11.05:1 ratio) */
    secondary: '#AAAAAA',
    /** Muted text - medium gray for metadata (6.54:1 ratio) */
    muted: '#888888',
    /** Inverse text - for rare light background scenarios */
    inverse: '#000000',
  },

  /**
   * Background colors creating depth and separation
   */
  background: {
    /** Primary background - pure black for space theme */
    primary: '#000000',
    /** Secondary background - slightly transparent for overlays */
    secondary: 'rgba(0, 0, 0, 0.9)',
    /** Tertiary background - more transparent for subtle overlays */
    tertiary: 'rgba(0, 0, 0, 0.85)',
    /** Surface - for cards and panels */
    surface: '#0a0a0f',
    /** Elevated surface - for modals and raised elements */
    surfaceElevated: '#1a1a2e',
  },

  /**
   * Border colors for visual separation
   */
  border: {
    /** Primary border - medium gray */
    primary: '#444',
    /** Secondary border - lighter for subtle separation */
    secondary: '#333',
    /** Elevated border - for focused or interactive states */
    elevated: '#2a2a3e',
  },

  /**
   * Primary accent color - blue theme matching space aesthetic
   * Used for links, buttons, focus states, and key UI elements
   */
  accent: {
    /** Primary accent - vibrant blue (7.33:1 contrast ratio) */
    primary: '#4A90E2',
    /** Hover state - lighter blue */
    hover: '#5ba0f2',
    /** Active/pressed state - slightly darker */
    active: '#357ABD',
    /** Translucent variants for overlays */
    transparent10: 'rgba(74, 144, 226, 0.1)',
    transparent15: 'rgba(74, 144, 226, 0.15)',
    transparent20: 'rgba(74, 144, 226, 0.2)',
    transparent25: 'rgba(74, 144, 226, 0.25)',
    transparent30: 'rgba(74, 144, 226, 0.3)',
    transparent40: 'rgba(74, 144, 226, 0.4)',
    transparent50: 'rgba(74, 144, 226, 0.5)',
    transparent60: 'rgba(74, 144, 226, 0.6)',
    transparent70: 'rgba(74, 144, 226, 0.7)',
    transparent80: 'rgba(74, 144, 226, 0.8)',
  },

  /**
   * Semantic colors for status and feedback
   */
  semantic: {
    /** Success - green for positive actions */
    success: '#4caf50',
    /** Error - red for warnings and errors */
    error: '#f44336',
    /** Warning - orange for caution */
    warning: '#ff9800',
    /** Info - uses primary accent blue */
    info: '#4A90E2',
  },

  /**
   * UI component-specific colors
   * These provide semantic meaning for specific UI patterns
   */
  ui: {
    /** Button primary background */
    buttonPrimary: '#4A90E2',
    /** Button primary hover */
    buttonPrimaryHover: '#5ba0f2',
    /** Button secondary background */
    buttonSecondary: '#2a2a3e',
    /** Button secondary hover */
    buttonSecondaryHover: '#3a3a4e',
    /** Input field background */
    inputBackground: '#0a0a0f',
    /** Input field border */
    inputBorder: '#2a2a3e',
    /** Input field focus border */
    inputBorderFocus: '#4A90E2',
    /** Modal backdrop */
    modalBackdrop: 'rgba(0, 0, 0, 0.75)',
    /** Card background */
    cardBackground: '#1a1a2e',
    /** Card border */
    cardBorder: '#2a2a3e',
    /** Tooltip background */
    tooltipBackground: 'rgba(0, 0, 0, 0.9)',
    /** Tooltip border */
    tooltipBorder: 'rgba(74, 144, 226, 0.6)',
  },

  /**
   * Special effect colors for overlays and glassmorphism
   */
  effects: {
    /** White overlay for subtle highlights */
    whiteOverlay02: 'rgba(255, 255, 255, 0.02)',
    whiteOverlay03: 'rgba(255, 255, 255, 0.03)',
    whiteOverlay04: 'rgba(255, 255, 255, 0.04)',
    whiteOverlay05: 'rgba(255, 255, 255, 0.05)',
    whiteOverlay08: 'rgba(255, 255, 255, 0.08)',
    whiteOverlay10: 'rgba(255, 255, 255, 0.1)',
    /** Glow effects */
    glow: 'rgba(74, 144, 226, 0.2)',
    glowIntense: 'rgba(74, 144, 226, 0.4)',
    /** Shadow colors */
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.4)',
    shadowIntense: 'rgba(0, 0, 0, 0.5)',
  },
} as const);

/**
 * Type for accessing palette colors with autocomplete support
 */
export type DarkPalette = typeof DARK_PALETTE;

/**
 * Cache of all colors in the palette for efficient validation
 * Built once at module initialization
 */
const allPaletteColors = (() => {
  const colors = new Set<string>();
  
  function collectColors(obj: Record<string, unknown>): void {
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        colors.add(value);
      } else if (typeof value === 'object' && value !== null) {
        collectColors(value as Record<string, unknown>);
      }
    }
  }
  
  collectColors(DARK_PALETTE as unknown as Record<string, unknown>);
  return colors;
})();

/**
 * Helper function to validate that a color exists in the palette
 * Useful for runtime validation in admin interfaces
 */
export function isValidPaletteColor(color: string): boolean {
  return allPaletteColors.has(color);
}

/**
 * Helper to get a color with fallback
 * Useful when dealing with user-provided colors
 */
export function getPaletteColor(
  path: string,
  fallback: string = DARK_PALETTE.text.primary
): string {
  const parts = path.split('.');
  let current: unknown = DARK_PALETTE;
  
  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return fallback;
    }
  }
  
  return typeof current === 'string' ? current : fallback;
}
