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
 * Unit tests for tooltip constants
 */

import {
  TOOLTIP_TYPOGRAPHY,
  TOOLTIP_POSITIONING,
  TOOLTIP_COLORS,
  TOOLTIP_PADDING,
} from '../tooltip-constants';

describe('Tooltip Constants', () => {
  describe('TOOLTIP_TYPOGRAPHY', () => {
    it('should define standard font size', () => {
      expect(TOOLTIP_TYPOGRAPHY.FONT_SIZE).toBe('1rem');
    });

    it('should define font weight', () => {
      expect(TOOLTIP_TYPOGRAPHY.FONT_WEIGHT).toBe('bold');
    });

    it('should define subtitle font size', () => {
      expect(TOOLTIP_TYPOGRAPHY.SUBTITLE_FONT_SIZE).toBe('0.85rem');
    });

    it('should define maximum width', () => {
      expect(TOOLTIP_TYPOGRAPHY.MAX_WIDTH).toBe('300px');
    });
  });

  describe('TOOLTIP_POSITIONING', () => {
    it('should define default vertical offset', () => {
      expect(TOOLTIP_POSITIONING.OFFSET_Y).toBe(-40);
    });

    it('should define default horizontal offset', () => {
      expect(TOOLTIP_POSITIONING.OFFSET_X).toBe(0);
    });

    it('should define distance factor for far zoom (universe view)', () => {
      expect(TOOLTIP_POSITIONING.DISTANCE_FACTOR_FAR).toBe(50);
    });

    it('should define distance factor for medium zoom (galaxy view)', () => {
      expect(TOOLTIP_POSITIONING.DISTANCE_FACTOR_MEDIUM).toBe(30);
    });

    it('should define distance factor for close zoom (solar system view)', () => {
      expect(TOOLTIP_POSITIONING.DISTANCE_FACTOR_CLOSE).toBe(10);
    });
  });

  describe('TOOLTIP_COLORS', () => {
    it('should define default border color', () => {
      expect(TOOLTIP_COLORS.BORDER_COLOR).toBe('rgba(74, 144, 226, 0.7)');
    });

    it('should define star/solar system border color', () => {
      expect(TOOLTIP_COLORS.STAR_BORDER_COLOR).toBe('rgba(251, 184, 19, 0.7)');
    });

    it('should define background color', () => {
      expect(TOOLTIP_COLORS.BACKGROUND_COLOR).toBe('rgba(0, 0, 0, 0.95)');
    });

    it('should define text color', () => {
      expect(TOOLTIP_COLORS.TEXT_COLOR).toBe('#FFFFFF');
    });
  });

  describe('TOOLTIP_PADDING', () => {
    it('should define default padding', () => {
      expect(TOOLTIP_PADDING.DEFAULT).toBe('0.75rem 1rem');
    });

    it('should define compact padding', () => {
      expect(TOOLTIP_PADDING.COMPACT).toBe('0.5rem 0.75rem');
    });
  });

  describe('Const correctness', () => {
    it('should have all constants defined as const objects', () => {
      // TypeScript's 'as const' assertion makes objects deeply readonly at compile time
      // At runtime, we can verify the constants exist and are objects
      expect(TOOLTIP_TYPOGRAPHY).toBeDefined();
      expect(TOOLTIP_POSITIONING).toBeDefined();
      expect(TOOLTIP_COLORS).toBeDefined();
      expect(TOOLTIP_PADDING).toBeDefined();

      // Verify they are objects
      expect(typeof TOOLTIP_TYPOGRAPHY).toBe('object');
      expect(typeof TOOLTIP_POSITIONING).toBe('object');
      expect(typeof TOOLTIP_COLORS).toBe('object');
      expect(typeof TOOLTIP_PADDING).toBe('object');
    });
  });

  describe('Value consistency', () => {
    it('should have subtitle font size smaller than main font size', () => {
      const mainSize = parseFloat(TOOLTIP_TYPOGRAPHY.FONT_SIZE);
      const subtitleSize = parseFloat(TOOLTIP_TYPOGRAPHY.SUBTITLE_FONT_SIZE);
      expect(subtitleSize).toBeLessThan(mainSize);
    });

    it('should have negative Y offset to position tooltips above objects', () => {
      expect(TOOLTIP_POSITIONING.OFFSET_Y).toBeLessThan(0);
    });

    it('should have distance factors in descending order (far > medium > close)', () => {
      expect(TOOLTIP_POSITIONING.DISTANCE_FACTOR_FAR).toBeGreaterThan(
        TOOLTIP_POSITIONING.DISTANCE_FACTOR_MEDIUM
      );
      expect(TOOLTIP_POSITIONING.DISTANCE_FACTOR_MEDIUM).toBeGreaterThan(
        TOOLTIP_POSITIONING.DISTANCE_FACTOR_CLOSE
      );
    });

    it('should have compact padding smaller than default padding', () => {
      const parsePadding = (padding: string): [number, number] => {
        const parts = padding.split(' ').map(p => parseFloat(p.replace('rem', '')));
        if (parts.length === 2 && !parts.some(isNaN)) {
          return [parts[0], parts[1]];
        }
        return [0, 0];
      };

      const [defaultVertical, defaultHorizontal] = parsePadding(TOOLTIP_PADDING.DEFAULT);
      const [compactVertical, compactHorizontal] = parsePadding(TOOLTIP_PADDING.COMPACT);

      expect(compactVertical).toBeLessThan(defaultVertical);
      expect(compactHorizontal).toBeLessThan(defaultHorizontal);
    });
  });
});
