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
 * Integration tests for dark mode enforcement - CSS verification
 * Ensures that no light mode CSS media queries exist in the codebase
 */

import fs from 'fs';
import path from 'path';

describe('CSS Dark Mode Enforcement', () => {
  const cssFiles = [
    'src/app/globals.css',
    'src/styles/planet.css',
    'src/styles/overlay-labels.css',
    'src/styles/sidebar.css',
    'src/styles/collapsible-section.css',
  ];

  describe('No Light Mode Media Queries', () => {
    cssFiles.forEach(filePath => {
      it(`should not contain prefers-color-scheme: light in ${filePath}`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check for light mode media query
        expect(content).not.toMatch(/@media\s*\([^)]*prefers-color-scheme:\s*light[^)]*\)/i);
      });
    });
  });

  describe('Dark Mode CSS Properties', () => {
    it('should have color-scheme: dark in globals.css', () => {
      const fullPath = path.join(process.cwd(), 'src/app/globals.css');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for color-scheme: dark declaration
      expect(content).toMatch(/color-scheme:\s*dark/i);
    });

    it('should have dark background colors in globals.css', () => {
      const fullPath = path.join(process.cwd(), 'src/app/globals.css');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Verify dark background (handles background, background-color, #000, #000000, black)
      expect(content).toMatch(/background(-color)?:\s*(#000000|#000|black)/i);
      // Verify light text (handles color, #fff, #ffffff, white)
      expect(content).toMatch(/color:\s*(#ffffff|#fff|white)/i);
    });
  });

  describe('Accessibility - Reduced Motion Support', () => {
    it('should preserve prefers-reduced-motion media queries', () => {
      const fullPath = path.join(process.cwd(), 'src/app/globals.css');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Accessibility media queries should remain
      expect(content).toMatch(/@media\s*\([^)]*prefers-reduced-motion[^)]*\)/i);
    });
  });

  describe('High Contrast Support', () => {
    it('should preserve prefers-contrast: high media queries for accessibility', () => {
      const fullPath = path.join(process.cwd(), 'src/styles/overlay-labels.css');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // High contrast accessibility should remain
      expect(content).toMatch(/@media\s*\([^)]*prefers-contrast:\s*high[^)]*\)/i);
    });
  });

  describe('CSS Files Exist', () => {
    cssFiles.forEach(filePath => {
      it(`should have ${filePath} file`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
