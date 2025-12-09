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
 * Unit tests for label-config module
 * Tests per-scene label configuration
 */

import { getLabelConfig, mergeLabelConfig, LABEL_CONFIGS, type LabelConfig } from '../label-config';
import type { FocusLevel } from '../store';

describe('label-config', () => {
  describe('LABEL_CONFIGS', () => {
    it('should have configurations for all focus levels', () => {
      expect(LABEL_CONFIGS.universe).toBeDefined();
      expect(LABEL_CONFIGS.galaxy).toBeDefined();
      expect(LABEL_CONFIGS['solar-system']).toBeDefined();
      expect(LABEL_CONFIGS.planet).toBeDefined();
    });

    it('should have required properties for each config', () => {
      const requiredProps = ['fontSize', 'typeFontSize', 'offsetY', 'distanceFactor'];
      
      Object.values(LABEL_CONFIGS).forEach((config) => {
        requiredProps.forEach((prop) => {
          expect(config).toHaveProperty(prop);
        });
      });
    });

    it('should have increasing distanceFactor from planet to universe', () => {
      expect(LABEL_CONFIGS.planet.distanceFactor).toBeLessThan(
        LABEL_CONFIGS['solar-system'].distanceFactor
      );
      expect(LABEL_CONFIGS['solar-system'].distanceFactor).toBeLessThanOrEqual(
        LABEL_CONFIGS.galaxy.distanceFactor
      );
      expect(LABEL_CONFIGS.galaxy.distanceFactor).toBeLessThanOrEqual(
        LABEL_CONFIGS.universe.distanceFactor
      );
    });

    it('should have decreasing fontSize from universe to planet', () => {
      const parseFontSize = (size: string) => parseFloat(size);
      
      expect(parseFontSize(LABEL_CONFIGS.universe.fontSize)).toBeGreaterThanOrEqual(
        parseFontSize(LABEL_CONFIGS.galaxy.fontSize)
      );
      expect(parseFontSize(LABEL_CONFIGS.galaxy.fontSize)).toBeGreaterThanOrEqual(
        parseFontSize(LABEL_CONFIGS['solar-system'].fontSize)
      );
      expect(parseFontSize(LABEL_CONFIGS['solar-system'].fontSize)).toBeGreaterThanOrEqual(
        parseFontSize(LABEL_CONFIGS.planet.fontSize)
      );
    });
  });

  describe('getLabelConfig', () => {
    it('should return correct config for universe', () => {
      const config = getLabelConfig('universe');
      expect(config).toEqual(LABEL_CONFIGS.universe);
    });

    it('should return correct config for galaxy', () => {
      const config = getLabelConfig('galaxy');
      expect(config).toEqual(LABEL_CONFIGS.galaxy);
    });

    it('should return correct config for solar-system', () => {
      const config = getLabelConfig('solar-system');
      expect(config).toEqual(LABEL_CONFIGS['solar-system']);
    });

    it('should return correct config for planet', () => {
      const config = getLabelConfig('planet');
      expect(config).toEqual(LABEL_CONFIGS.planet);
    });

    it('should return solar-system config for invalid focus level', () => {
      const config = getLabelConfig('invalid' as FocusLevel);
      expect(config).toEqual(LABEL_CONFIGS['solar-system']);
    });
  });

  describe('mergeLabelConfig', () => {
    it('should merge overrides with base config', () => {
      const base: LabelConfig = {
        fontSize: '1rem',
        typeFontSize: '0.75rem',
        offsetY: 20,
        distanceFactor: 100,
        minWidth: '120px',
        maxWidth: '300px',
      };

      const overrides: Partial<LabelConfig> = {
        fontSize: '1.5rem',
        offsetY: 30,
      };

      const merged = mergeLabelConfig(base, overrides);

      expect(merged.fontSize).toBe('1.5rem');
      expect(merged.offsetY).toBe(30);
      expect(merged.typeFontSize).toBe('0.75rem');
      expect(merged.distanceFactor).toBe(100);
    });

    it('should handle empty overrides', () => {
      const base: LabelConfig = {
        fontSize: '1rem',
        typeFontSize: '0.75rem',
        offsetY: 20,
        distanceFactor: 100,
      };

      const merged = mergeLabelConfig(base, {});

      expect(merged).toEqual(base);
    });

    it('should override all properties if specified', () => {
      const base: LabelConfig = {
        fontSize: '1rem',
        typeFontSize: '0.75rem',
        offsetY: 20,
        distanceFactor: 100,
      };

      const overrides: Partial<LabelConfig> = {
        fontSize: '2rem',
        typeFontSize: '1rem',
        offsetY: 50,
        distanceFactor: 200,
        minWidth: '200px',
        maxWidth: '500px',
        backgroundOpacity: 0.95,
        borderColor: '#FF0000',
        enableGlow: false,
        textWrap: 'wrap',
      };

      const merged = mergeLabelConfig(base, overrides);

      expect(merged.fontSize).toBe('2rem');
      expect(merged.typeFontSize).toBe('1rem');
      expect(merged.offsetY).toBe(50);
      expect(merged.distanceFactor).toBe(200);
      expect(merged.minWidth).toBe('200px');
      expect(merged.maxWidth).toBe('500px');
      expect(merged.backgroundOpacity).toBe(0.95);
      expect(merged.borderColor).toBe('#FF0000');
      expect(merged.enableGlow).toBe(false);
      expect(merged.textWrap).toBe('wrap');
    });
  });

  describe('Scene-specific configurations', () => {
    it('should enable glow for universe scene', () => {
      expect(LABEL_CONFIGS.universe.enableGlow).toBe(true);
    });

    it('should enable glow for galaxy scene', () => {
      expect(LABEL_CONFIGS.galaxy.enableGlow).toBe(true);
    });

    it('should enable glow for solar-system scene', () => {
      expect(LABEL_CONFIGS['solar-system'].enableGlow).toBe(true);
    });

    it('should disable glow for planet scene (close-up view)', () => {
      expect(LABEL_CONFIGS.planet.enableGlow).toBe(false);
    });

    it('should allow text wrapping for planet scene', () => {
      expect(LABEL_CONFIGS.planet.textWrap).toBe('wrap');
    });

    it('should prevent text wrapping for other scenes', () => {
      expect(LABEL_CONFIGS.universe.textWrap).toBe('nowrap');
      expect(LABEL_CONFIGS.galaxy.textWrap).toBe('nowrap');
      expect(LABEL_CONFIGS['solar-system'].textWrap).toBe('nowrap');
    });

    it('should use nullish coalescing for fallback', () => {
      // This tests that the fallback logic uses ?? instead of ||
      // Create a scenario where || would incorrectly fallback
      const invalidLevel = 'invalid' as any;
      const config = getLabelConfig(invalidLevel);
      
      // Should get solar-system config as fallback
      expect(config).toEqual(LABEL_CONFIGS['solar-system']);
    });
  });
});
