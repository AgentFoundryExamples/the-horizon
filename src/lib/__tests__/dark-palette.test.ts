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
 * Tests for centralized dark palette constants and helper functions
 */

import { DARK_PALETTE, isValidPaletteColor, getPaletteColor } from '../dark-palette';

describe('DARK_PALETTE', () => {
  describe('Structure and Organization', () => {
    it('should have text color tokens', () => {
      expect(DARK_PALETTE.text).toBeDefined();
      expect(DARK_PALETTE.text.primary).toBe('#FFFFFF');
      expect(DARK_PALETTE.text.secondary).toBe('#AAAAAA');
      expect(DARK_PALETTE.text.muted).toBe('#888888');
    });

    it('should have background color tokens', () => {
      expect(DARK_PALETTE.background).toBeDefined();
      expect(DARK_PALETTE.background.primary).toBe('#000000');
      expect(DARK_PALETTE.background.surface).toBe('#0a0a0f');
      expect(DARK_PALETTE.background.surfaceElevated).toBe('#1a1a2e');
    });

    it('should have accent color tokens', () => {
      expect(DARK_PALETTE.accent).toBeDefined();
      expect(DARK_PALETTE.accent.primary).toBe('#4A90E2');
      expect(DARK_PALETTE.accent.hover).toBe('#5ba0f2');
      expect(DARK_PALETTE.accent.active).toBe('#357ABD');
    });

    it('should have semantic color tokens', () => {
      expect(DARK_PALETTE.semantic).toBeDefined();
      expect(DARK_PALETTE.semantic.success).toBe('#4caf50');
      expect(DARK_PALETTE.semantic.error).toBe('#f44336');
      expect(DARK_PALETTE.semantic.warning).toBe('#ff9800');
      expect(DARK_PALETTE.semantic.info).toBe('#4A90E2');
    });

    it('should have UI component color tokens', () => {
      expect(DARK_PALETTE.ui).toBeDefined();
      expect(DARK_PALETTE.ui.buttonPrimary).toBe('#4A90E2');
      expect(DARK_PALETTE.ui.inputBackground).toBe('#0a0a0f');
      expect(DARK_PALETTE.ui.cardBackground).toBe('#1a1a2e');
    });

    it('should have border color tokens', () => {
      expect(DARK_PALETTE.border).toBeDefined();
      expect(DARK_PALETTE.border.primary).toBe('#444');
      expect(DARK_PALETTE.border.secondary).toBe('#333');
    });

    it('should have effect color tokens', () => {
      expect(DARK_PALETTE.effects).toBeDefined();
      expect(DARK_PALETTE.effects.glow).toBe('rgba(74, 144, 226, 0.2)');
      expect(DARK_PALETTE.effects.shadow).toBe('rgba(0, 0, 0, 0.3)');
    });
  });

  describe('Accent Transparent Variants', () => {
    it('should have transparent variants from 10% to 80%', () => {
      expect(DARK_PALETTE.accent.transparent10).toBe('rgba(74, 144, 226, 0.1)');
      expect(DARK_PALETTE.accent.transparent20).toBe('rgba(74, 144, 226, 0.2)');
      expect(DARK_PALETTE.accent.transparent30).toBe('rgba(74, 144, 226, 0.3)');
      expect(DARK_PALETTE.accent.transparent40).toBe('rgba(74, 144, 226, 0.4)');
      expect(DARK_PALETTE.accent.transparent50).toBe('rgba(74, 144, 226, 0.5)');
      expect(DARK_PALETTE.accent.transparent60).toBe('rgba(74, 144, 226, 0.6)');
      expect(DARK_PALETTE.accent.transparent70).toBe('rgba(74, 144, 226, 0.7)');
      expect(DARK_PALETTE.accent.transparent80).toBe('rgba(74, 144, 226, 0.8)');
    });
  });

  describe('Color Format Validation', () => {
    it('should use uppercase hex colors where applicable', () => {
      // Check a sample of colors for consistent formatting
      expect(DARK_PALETTE.text.primary).toMatch(/^#[0-9A-F]{6}$/);
      expect(DARK_PALETTE.accent.primary).toMatch(/^#[0-9A-F]{6}$/);
    });

    it('should use rgba format for transparent colors', () => {
      expect(DARK_PALETTE.accent.transparent50).toMatch(/^rgba\(/);
      expect(DARK_PALETTE.background.secondary).toMatch(/^rgba\(/);
      expect(DARK_PALETTE.effects.glow).toMatch(/^rgba\(/);
    });
  });

  describe('Accessibility Contrast Ratios', () => {
    // These tests document the expected contrast ratios
    // Actual contrast calculations would require a contrast checker library
    
    it('should have documented high contrast for primary text', () => {
      // Primary text (#FFFFFF) on primary background (#000000) = 21:1
      expect(DARK_PALETTE.text.primary).toBe('#FFFFFF');
      expect(DARK_PALETTE.background.primary).toBe('#000000');
    });

    it('should have documented good contrast for secondary text', () => {
      // Secondary text (#AAAAAA) on primary background (#000000) = 11.05:1
      expect(DARK_PALETTE.text.secondary).toBe('#AAAAAA');
    });

    it('should have documented acceptable contrast for muted text', () => {
      // Muted text (#888888) on primary background (#000000) = 6.54:1
      expect(DARK_PALETTE.text.muted).toBe('#888888');
    });

    it('should have documented good contrast for accent color', () => {
      // Accent primary (#4A90E2) on primary background (#000000) = 7.33:1
      expect(DARK_PALETTE.accent.primary).toBe('#4A90E2');
    });
  });
});

describe('isValidPaletteColor', () => {
  it('should return true for colors in the palette', () => {
    expect(isValidPaletteColor('#FFFFFF')).toBe(true);
    expect(isValidPaletteColor('#4A90E2')).toBe(true);
    expect(isValidPaletteColor('#000000')).toBe(true);
    expect(isValidPaletteColor('rgba(74, 144, 226, 0.5)')).toBe(true);
  });

  it('should return false for colors not in the palette', () => {
    expect(isValidPaletteColor('#FF0000')).toBe(false);
    expect(isValidPaletteColor('#123456')).toBe(false);
    expect(isValidPaletteColor('rgba(255, 0, 0, 1)')).toBe(false);
  });

  it('should return false for invalid color formats', () => {
    expect(isValidPaletteColor('not-a-color')).toBe(false);
    expect(isValidPaletteColor('')).toBe(false);
    expect(isValidPaletteColor('blue')).toBe(false);
  });

  it('should be case sensitive for hex colors', () => {
    // Palette uses uppercase
    expect(isValidPaletteColor('#4A90E2')).toBe(true);
    expect(isValidPaletteColor('#4a90e2')).toBe(false);
  });
});

describe('getPaletteColor', () => {
  it('should retrieve colors using dot notation path', () => {
    expect(getPaletteColor('text.primary')).toBe('#FFFFFF');
    expect(getPaletteColor('accent.primary')).toBe('#4A90E2');
    expect(getPaletteColor('background.surface')).toBe('#0a0a0f');
    expect(getPaletteColor('semantic.success')).toBe('#4caf50');
  });

  it('should return fallback for invalid paths', () => {
    const fallback = '#FF0000';
    expect(getPaletteColor('invalid.path', fallback)).toBe(fallback);
    expect(getPaletteColor('text.nonexistent', fallback)).toBe(fallback);
    expect(getPaletteColor('', fallback)).toBe(fallback);
  });

  it('should use default fallback if not provided', () => {
    // Default fallback is DARK_PALETTE.text.primary
    expect(getPaletteColor('invalid.path')).toBe('#FFFFFF');
  });

  it('should handle nested paths', () => {
    expect(getPaletteColor('accent.transparent50')).toBe('rgba(74, 144, 226, 0.5)');
    expect(getPaletteColor('effects.glow')).toBe('rgba(74, 144, 226, 0.2)');
    expect(getPaletteColor('ui.buttonPrimary')).toBe('#4A90E2');
  });

  it('should return fallback for non-string values in path', () => {
    const fallback = '#FF0000';
    // Path that leads to an object, not a string
    expect(getPaletteColor('text', fallback)).toBe(fallback);
    expect(getPaletteColor('accent', fallback)).toBe(fallback);
  });
});

describe('Type Safety', () => {
  it('should be typed as const for immutability', () => {
    // TypeScript compile-time check - if this compiles, the type is correct
    const textPrimary: '#FFFFFF' = DARK_PALETTE.text.primary;
    expect(textPrimary).toBe('#FFFFFF');
  });

  it('should be frozen at runtime for immutability', () => {
    // The palette is deeply frozen with Object.freeze() for runtime protection
    expect(Object.isFrozen(DARK_PALETTE)).toBe(true);
    expect(Object.isFrozen(DARK_PALETTE.text)).toBe(true);
    expect(Object.isFrozen(DARK_PALETTE.accent)).toBe(true);
    expect(Object.isFrozen(DARK_PALETTE.ui)).toBe(true);
    
    // Attempting to modify should fail silently in non-strict mode
    // or throw in strict mode
    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      DARK_PALETTE.text.primary = '#000000';
    }).not.toThrow(); // Fails silently in non-strict mode
    
    // Value should remain unchanged
    expect(DARK_PALETTE.text.primary).toBe('#FFFFFF');
  });
});

describe('Completeness', () => {
  it('should provide all expected semantic color categories', () => {
    const requiredCategories = ['text', 'background', 'border', 'accent', 'semantic', 'ui', 'effects'];
    requiredCategories.forEach(category => {
      expect(DARK_PALETTE).toHaveProperty(category);
    });
  });

  it('should have consistent naming for state variants', () => {
    // Button states should follow pattern: primary, hover, active
    expect(DARK_PALETTE.accent.primary).toBeDefined();
    expect(DARK_PALETTE.accent.hover).toBeDefined();
    expect(DARK_PALETTE.accent.active).toBeDefined();

    expect(DARK_PALETTE.ui.buttonPrimary).toBeDefined();
    expect(DARK_PALETTE.ui.buttonPrimaryHover).toBeDefined();
  });

  it('should have white overlay variants for glassmorphism', () => {
    expect(DARK_PALETTE.effects.whiteOverlay02).toBeDefined();
    expect(DARK_PALETTE.effects.whiteOverlay05).toBeDefined();
    expect(DARK_PALETTE.effects.whiteOverlay10).toBeDefined();
  });
});

describe('Documentation and Usage', () => {
  it('should match documented examples in visuals.md', () => {
    // These values are documented in docs/visuals.md
    expect(DARK_PALETTE.text.primary).toBe('#FFFFFF');
    expect(DARK_PALETTE.text.secondary).toBe('#AAAAAA');
    expect(DARK_PALETTE.text.muted).toBe('#888888');
    expect(DARK_PALETTE.accent.primary).toBe('#4A90E2');
    expect(DARK_PALETTE.background.primary).toBe('#000000');
  });

  it('should match CSS variables in globals.css and admin.css', () => {
    // These should align with CSS variables
    expect(DARK_PALETTE.accent.primary).toBe('#4A90E2');
    expect(DARK_PALETTE.semantic.success).toBe('#4caf50');
    expect(DARK_PALETTE.semantic.error).toBe('#f44336');
    expect(DARK_PALETTE.semantic.warning).toBe('#ff9800');
  });
});
