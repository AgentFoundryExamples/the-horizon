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
 * Integration tests for overlay hover labels
 */

import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useHoverStore } from '@/lib/hover-store';
import * as THREE from 'three';

describe('Overlay Hover Labels Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useHoverStore());
    act(() => {
      result.current.clearHover();
      result.current.setLabelsVisibility(true);
    });
  });

  describe('Hover State Flow', () => {
    it('should track hover state from galaxy to clear', () => {
      const { result } = renderHook(() => useHoverStore());

      // No hover initially
      expect(result.current.hoveredObject).toBeNull();

      // Simulate hovering over a galaxy
      act(() => {
        result.current.setHoveredObject({
          id: 'galaxy-1',
          name: 'Andromeda',
          type: 'galaxy',
          position: new THREE.Vector3(50, 0, 0),
          metadata: {
            description: 'Nearest major galaxy',
            planetCount: 200,
          },
        });
      });

      expect(result.current.hoveredObject?.name).toBe('Andromeda');
      expect(result.current.hoveredObject?.type).toBe('galaxy');

      // Simulate mouse leaving
      act(() => {
        result.current.clearHover();
      });

      expect(result.current.hoveredObject).toBeNull();
    });

    it('should switch hover between different object types', () => {
      const { result } = renderHook(() => useHoverStore());

      // Hover over galaxy
      act(() => {
        result.current.setHoveredObject({
          id: 'galaxy-1',
          name: 'Milky Way',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });
      expect(result.current.hoveredObject?.type).toBe('galaxy');

      // Switch to solar system
      act(() => {
        result.current.setHoveredObject({
          id: 'system-1',
          name: 'Solar System',
          type: 'solar-system',
          position: new THREE.Vector3(10, 0, 0),
        });
      });
      expect(result.current.hoveredObject?.type).toBe('solar-system');
      expect(result.current.hoveredObject?.name).toBe('Solar System');

      // Switch to planet
      act(() => {
        result.current.setHoveredObject({
          id: 'planet-1',
          name: 'Earth',
          type: 'planet',
          position: new THREE.Vector3(5, 0, 5),
          metadata: {
            description: 'Our home world',
            moonCount: 1,
          },
        });
      });
      expect(result.current.hoveredObject?.type).toBe('planet');
      expect(result.current.hoveredObject?.metadata?.moonCount).toBe(1);

      // Switch to star
      act(() => {
        result.current.setHoveredObject({
          id: 'star-1',
          name: 'Betelgeuse',
          type: 'star',
          position: new THREE.Vector3(100, 50, 0),
        });
      });
      expect(result.current.hoveredObject?.type).toBe('star');
      expect(result.current.hoveredObject?.name).toBe('Betelgeuse');
    });
  });

  describe('Label Visibility Control', () => {
    it('should respect labels visibility when hovering', () => {
      const { result } = renderHook(() => useHoverStore());

      // Hover with labels visible
      act(() => {
        result.current.setHoveredObject({
          id: 'galaxy-1',
          name: 'Andromeda',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      expect(result.current.hoveredObject).not.toBeNull();
      expect(result.current.labelsVisible).toBe(true);

      // Toggle labels off
      act(() => {
        result.current.toggleLabelsVisibility();
      });

      expect(result.current.hoveredObject).not.toBeNull(); // Still hovered
      expect(result.current.labelsVisible).toBe(false); // But labels hidden

      // Toggle labels back on
      act(() => {
        result.current.toggleLabelsVisibility();
      });

      expect(result.current.hoveredObject).not.toBeNull();
      expect(result.current.labelsVisible).toBe(true);
    });

    it('should maintain hover state when toggling visibility', () => {
      const { result } = renderHook(() => useHoverStore());

      const hoverObj = {
        id: 'planet-1',
        name: 'Mars',
        type: 'planet' as const,
        position: new THREE.Vector3(10, 0, 0),
        metadata: {
          description: 'The Red Planet',
          moonCount: 2,
        },
      };

      act(() => {
        result.current.setHoveredObject(hoverObj);
      });

      // Multiple visibility toggles shouldn't affect hover state
      act(() => {
        result.current.toggleLabelsVisibility();
        result.current.toggleLabelsVisibility();
        result.current.toggleLabelsVisibility();
      });

      expect(result.current.hoveredObject).toEqual(hoverObj);
      expect(result.current.labelsVisible).toBe(false);
    });
  });

  describe('Multi-Object Hover Scenarios', () => {
    it('should handle rapid hover changes', () => {
      const { result } = renderHook(() => useHoverStore());

      const objects = [
        {
          id: 'obj-1',
          name: 'Object 1',
          type: 'galaxy' as const,
          position: new THREE.Vector3(0, 0, 0),
        },
        {
          id: 'obj-2',
          name: 'Object 2',
          type: 'planet' as const,
          position: new THREE.Vector3(10, 0, 0),
        },
        {
          id: 'obj-3',
          name: 'Object 3',
          type: 'star' as const,
          position: new THREE.Vector3(20, 0, 0),
        },
      ];

      // Rapidly switch between objects
      act(() => {
        objects.forEach((obj) => {
          result.current.setHoveredObject(obj);
        });
      });

      // Should end up on the last object
      expect(result.current.hoveredObject?.id).toBe('obj-3');
      expect(result.current.hoveredObject?.name).toBe('Object 3');
    });

    it('should handle hover with complex metadata', () => {
      const { result } = renderHook(() => useHoverStore());

      act(() => {
        result.current.setHoveredObject({
          id: 'system-complex',
          name: 'Alpha Centauri',
          type: 'solar-system',
          position: new THREE.Vector3(100, 50, 25),
          metadata: {
            description: 'Nearest star system to our solar system',
            planetCount: 3,
            theme: 'triple-star',
          },
        });
      });

      const obj = result.current.hoveredObject;
      expect(obj).not.toBeNull();
      expect(obj?.metadata?.description).toBeTruthy();
      expect(obj?.metadata?.planetCount).toBe(3);
      expect(obj?.metadata?.theme).toBe('triple-star');
    });
  });

  describe('Edge Cases', () => {
    it('should handle hovering same object twice', () => {
      const { result } = renderHook(() => useHoverStore());

      const obj = {
        id: 'galaxy-1',
        name: 'Milky Way',
        type: 'galaxy' as const,
        position: new THREE.Vector3(0, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(obj);
      });
      const firstHover = result.current.hoveredObject;

      act(() => {
        result.current.setHoveredObject(obj);
      });
      const secondHover = result.current.hoveredObject;

      expect(firstHover).toEqual(secondHover);
    });

    it('should handle null position vector', () => {
      const { result } = renderHook(() => useHoverStore());

      act(() => {
        result.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'planet',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      expect(result.current.hoveredObject?.position).toBeDefined();
      expect(result.current.hoveredObject?.position.x).toBe(0);
      expect(result.current.hoveredObject?.position.y).toBe(0);
      expect(result.current.hoveredObject?.position.z).toBe(0);
    });

    it('should handle empty metadata', () => {
      const { result } = renderHook(() => useHoverStore());

      act(() => {
        result.current.setHoveredObject({
          id: 'star-1',
          name: 'Proxima Centauri',
          type: 'star',
          position: new THREE.Vector3(50, 50, 50),
          metadata: {},
        });
      });

      expect(result.current.hoveredObject?.metadata).toBeDefined();
      expect(result.current.hoveredObject?.metadata?.description).toBeUndefined();
      expect(result.current.hoveredObject?.metadata?.planetCount).toBeUndefined();
    });
  });

  describe('Store Persistence', () => {
    it('should maintain state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useHoverStore());
      const { result: result2 } = renderHook(() => useHoverStore());

      // Set hover in first instance
      act(() => {
        result1.current.setHoveredObject({
          id: 'galaxy-1',
          name: 'Andromeda',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      // Should be visible in second instance
      expect(result2.current.hoveredObject?.name).toBe('Andromeda');

      // Clear in second instance
      act(() => {
        result2.current.clearHover();
      });

      // Should be cleared in first instance
      expect(result1.current.hoveredObject).toBeNull();
    });

    it('should synchronize visibility state across instances', () => {
      const { result: result1 } = renderHook(() => useHoverStore());
      const { result: result2 } = renderHook(() => useHoverStore());

      // Both should start with labels visible
      expect(result1.current.labelsVisible).toBe(true);
      expect(result2.current.labelsVisible).toBe(true);

      // Toggle in first instance
      act(() => {
        result1.current.toggleLabelsVisibility();
      });

      // Should affect second instance
      expect(result2.current.labelsVisible).toBe(false);

      // Set explicitly in second instance
      act(() => {
        result2.current.setLabelsVisibility(true);
      });

      // Should affect first instance
      expect(result1.current.labelsVisible).toBe(true);
    });
  });
});
