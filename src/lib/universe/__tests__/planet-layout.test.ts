/**
 * Tests for Planet Layout Configuration utilities
 */

import {
  DEFAULT_PLANET_LAYOUT,
  LAYOUT_RANGES,
  normalizePlanetLayout,
  validateLayoutConfig,
  layoutConfigToCSS,
} from '../planet-layout';
import type { PlanetLayoutConfig } from '../types';

describe('Planet Layout Configuration', () => {
  describe('normalizePlanetLayout', () => {
    it('should return default configuration when no config provided', () => {
      const result = normalizePlanetLayout();
      expect(result).toEqual(DEFAULT_PLANET_LAYOUT);
    });

    it('should merge planet config with defaults', () => {
      const planetConfig: PlanetLayoutConfig = {
        planetColumnWidth: 35,
        planetRenderScale: 1.5,
      };
      
      const result = normalizePlanetLayout(planetConfig);
      
      expect(result.planetColumnWidth).toBe(35);
      expect(result.planetRenderScale).toBe(1.5);
      expect(result.planetOffsetX).toBe(DEFAULT_PLANET_LAYOUT.planetOffsetX);
      expect(result.contentPadding).toBe(DEFAULT_PLANET_LAYOUT.contentPadding);
    });

    it('should clamp planetColumnWidth to safe range', () => {
      const tooSmall = normalizePlanetLayout({ planetColumnWidth: 10 });
      expect(tooSmall.planetColumnWidth).toBe(LAYOUT_RANGES.planetColumnWidth.min);

      const tooLarge = normalizePlanetLayout({ planetColumnWidth: 80 });
      expect(tooLarge.planetColumnWidth).toBe(LAYOUT_RANGES.planetColumnWidth.max);

      const justRight = normalizePlanetLayout({ planetColumnWidth: 35 });
      expect(justRight.planetColumnWidth).toBe(35);
    });

    it('should clamp planetRenderScale to safe range', () => {
      const tooSmall = normalizePlanetLayout({ planetRenderScale: 0.1 });
      expect(tooSmall.planetRenderScale).toBe(LAYOUT_RANGES.planetRenderScale.min);

      const tooLarge = normalizePlanetLayout({ planetRenderScale: 5.0 });
      expect(tooLarge.planetRenderScale).toBe(LAYOUT_RANGES.planetRenderScale.max);
    });

    it('should clamp offset values to safe range', () => {
      const result = normalizePlanetLayout({
        planetOffsetX: -100,
        planetOffsetY: 100,
      });

      expect(result.planetOffsetX).toBe(LAYOUT_RANGES.planetOffsetX.min);
      expect(result.planetOffsetY).toBe(LAYOUT_RANGES.planetOffsetY.max);
    });

    it('should clamp content values to safe range', () => {
      const result = normalizePlanetLayout({
        contentPadding: 10,
        contentMaxWidth: 2000,
      });

      expect(result.contentPadding).toBe(LAYOUT_RANGES.contentPadding.max);
      expect(result.contentMaxWidth).toBe(LAYOUT_RANGES.contentMaxWidth.max);
    });

    it('should prefer planet config over global config', () => {
      const globalConfig: PlanetLayoutConfig = {
        planetColumnWidth: 25,
        planetRenderScale: 0.8,
      };

      const planetConfig: PlanetLayoutConfig = {
        planetColumnWidth: 40,
      };

      const result = normalizePlanetLayout(planetConfig, globalConfig);

      expect(result.planetColumnWidth).toBe(40); // From planet
      expect(result.planetRenderScale).toBe(0.8); // From global
    });

    it('should handle all configuration values simultaneously', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: 35,
        planetRenderScale: 1.2,
        planetOffsetX: 10,
        planetOffsetY: -5,
        contentPadding: 3,
        contentMaxWidth: 900,
      };

      const result = normalizePlanetLayout(config);

      expect(result).toEqual({
        planetColumnWidth: 35,
        planetRenderScale: 1.2,
        planetOffsetX: 10,
        planetOffsetY: -5,
        contentPadding: 3,
        contentMaxWidth: 900,
      });
    });
  });

  describe('validateLayoutConfig', () => {
    it('should return empty array for valid configuration', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: 30,
        planetRenderScale: 1.0,
        planetOffsetX: 0,
        planetOffsetY: 0,
        contentPadding: 2,
        contentMaxWidth: 800,
      };

      const warnings = validateLayoutConfig(config);
      expect(warnings).toHaveLength(0);
    });

    it('should warn about out-of-range planetColumnWidth', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: 60,
      };

      const warnings = validateLayoutConfig(config);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('planetColumnWidth');
      expect(warnings[0]).toContain('outside safe range');
    });

    it('should warn about multiple out-of-range values', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: 10,
        planetRenderScale: 3.0,
        planetOffsetX: -100,
      };

      const warnings = validateLayoutConfig(config);
      expect(warnings.length).toBeGreaterThanOrEqual(3);
    });

    it('should not warn about undefined values', () => {
      const config: PlanetLayoutConfig = {};
      const warnings = validateLayoutConfig(config);
      expect(warnings).toHaveLength(0);
    });

    it('should provide specific warning messages', () => {
      const config: PlanetLayoutConfig = {
        planetRenderScale: 5.0,
      };

      const warnings = validateLayoutConfig(config);
      expect(warnings[0]).toContain('planetRenderScale 5');
      expect(warnings[0]).toContain('[0.5, 2]');
      expect(warnings[0]).toContain('clamped');
    });
  });

  describe('layoutConfigToCSS', () => {
    it('should convert configuration to CSS custom properties', () => {
      const config = DEFAULT_PLANET_LAYOUT;
      const css = layoutConfigToCSS(config);

      expect(css['--planet-column-width']).toBe('30%');
      expect(css['--planet-render-scale']).toBe('1');
      expect(css['--planet-offset-x']).toBe('0%');
      expect(css['--planet-offset-y']).toBe('0%');
      expect(css['--content-padding']).toBe('2rem');
      expect(css['--content-max-width']).toBe('800px');
    });

    it('should handle custom values correctly', () => {
      const config = {
        planetColumnWidth: 40,
        planetRenderScale: 1.5,
        planetOffsetX: -10,
        planetOffsetY: 5,
        contentPadding: 3.5,
        contentMaxWidth: 1000,
      };

      const css = layoutConfigToCSS(config);

      expect(css['--planet-column-width']).toBe('40%');
      expect(css['--planet-render-scale']).toBe('1.5');
      expect(css['--planet-offset-x']).toBe('-10%');
      expect(css['--planet-offset-y']).toBe('5%');
      expect(css['--content-padding']).toBe('3.5rem');
      expect(css['--content-max-width']).toBe('1000px');
    });

    it('should produce valid CSS property names', () => {
      const config = DEFAULT_PLANET_LAYOUT;
      const css = layoutConfigToCSS(config);

      Object.keys(css).forEach(key => {
        expect(key).toMatch(/^--[a-z-]+$/);
      });
    });

    it('should produce valid CSS values with units', () => {
      const config = DEFAULT_PLANET_LAYOUT;
      const css = layoutConfigToCSS(config);

      expect(css['--planet-column-width']).toMatch(/^\d+%$/);
      expect(css['--planet-render-scale']).toMatch(/^\d+\.?\d*$/);
      expect(css['--planet-offset-x']).toMatch(/^-?\d+%$/);
      expect(css['--planet-offset-y']).toMatch(/^-?\d+%$/);
      expect(css['--content-padding']).toMatch(/^\d+\.?\d*rem$/);
      expect(css['--content-max-width']).toMatch(/^\d+px$/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative zero correctly', () => {
      const config: PlanetLayoutConfig = {
        planetOffsetX: -0,
        planetOffsetY: -0,
      };

      const result = normalizePlanetLayout(config);
      // In JavaScript, -0 === 0, but Object.is(-0, 0) === false
      // We just verify the values work correctly (both are treated as 0 in practice)
      expect(Math.abs(result.planetOffsetX)).toBe(0);
      expect(Math.abs(result.planetOffsetY)).toBe(0);
    });

    it('should handle boundary values exactly', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: LAYOUT_RANGES.planetColumnWidth.min,
        planetRenderScale: LAYOUT_RANGES.planetRenderScale.max,
      };

      const result = normalizePlanetLayout(config);
      expect(result.planetColumnWidth).toBe(LAYOUT_RANGES.planetColumnWidth.min);
      expect(result.planetRenderScale).toBe(LAYOUT_RANGES.planetRenderScale.max);

      const warnings = validateLayoutConfig(config);
      expect(warnings).toHaveLength(0);
    });

    it('should handle fractional values', () => {
      const config: PlanetLayoutConfig = {
        planetRenderScale: 1.234567,
        contentPadding: 2.5,
      };

      const result = normalizePlanetLayout(config);
      expect(result.planetRenderScale).toBeCloseTo(1.234567);
      expect(result.contentPadding).toBe(2.5);
    });

    it('should preserve all values when all are valid', () => {
      const config: PlanetLayoutConfig = {
        planetColumnWidth: 35,
        planetRenderScale: 1.25,
        planetOffsetX: 5,
        planetOffsetY: -3,
        contentPadding: 2.5,
        contentMaxWidth: 950,
      };

      const result = normalizePlanetLayout(config);
      expect(result).toEqual(config);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle Earth-like planet with default layout', () => {
      const result = normalizePlanetLayout();
      const css = layoutConfigToCSS(result);

      expect(css['--planet-column-width']).toBe('30%');
      expect(css['--content-max-width']).toBe('800px');
    });

    it('should handle Mars with compact layout', () => {
      const marsConfig: PlanetLayoutConfig = {
        planetColumnWidth: 25,
        contentMaxWidth: 700,
      };

      const result = normalizePlanetLayout(marsConfig);
      const css = layoutConfigToCSS(result);

      expect(css['--planet-column-width']).toBe('25%');
      expect(css['--content-max-width']).toBe('700px');
    });

    it('should handle Jupiter with prominent visualization', () => {
      const jupiterConfig: PlanetLayoutConfig = {
        planetColumnWidth: 45,
        planetRenderScale: 1.8,
        contentMaxWidth: 650,
      };

      const result = normalizePlanetLayout(jupiterConfig);
      expect(result.planetColumnWidth).toBe(45);
      expect(result.planetRenderScale).toBe(1.8);
    });

    it('should handle legacy data with missing config', () => {
      const result = normalizePlanetLayout(undefined);
      expect(result).toEqual(DEFAULT_PLANET_LAYOUT);
    });
  });
});
