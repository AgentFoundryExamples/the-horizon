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
 * Unit tests for hover-store
 */

import { renderHook, act } from '@testing-library/react';
import { useHoverStore } from '../hover-store';
import * as THREE from 'three';
import type { HoveredObject } from '../hover-store';

describe('useHoverStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useHoverStore());
    act(() => {
      result.current.clearHover();
      result.current.setLabelsVisibility(true);
    });
  });

  describe('Initial State', () => {
    it('should initialize with null hoveredObject', () => {
      const { result } = renderHook(() => useHoverStore());
      expect(result.current.hoveredObject).toBeNull();
    });

    it('should initialize with labelsVisible true', () => {
      const { result } = renderHook(() => useHoverStore());
      expect(result.current.labelsVisible).toBe(true);
    });
  });

  describe('setHoveredObject', () => {
    it('should set hovered object', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const hoveredObj: HoveredObject = {
        id: 'galaxy-1',
        name: 'Milky Way',
        type: 'galaxy',
        position: new THREE.Vector3(10, 0, 0),
        metadata: {
          description: 'Our home galaxy',
          planetCount: 100,
        },
      };

      act(() => {
        result.current.setHoveredObject(hoveredObj);
      });

      expect(result.current.hoveredObject).toEqual(hoveredObj);
    });

    it('should update hovered object when called multiple times', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const obj1: HoveredObject = {
        id: 'galaxy-1',
        name: 'Milky Way',
        type: 'galaxy',
        position: new THREE.Vector3(10, 0, 0),
      };

      const obj2: HoveredObject = {
        id: 'planet-1',
        name: 'Earth',
        type: 'planet',
        position: new THREE.Vector3(5, 0, 5),
      };

      act(() => {
        result.current.setHoveredObject(obj1);
      });
      expect(result.current.hoveredObject).toEqual(obj1);

      act(() => {
        result.current.setHoveredObject(obj2);
      });
      expect(result.current.hoveredObject).toEqual(obj2);
    });

    it('should handle null to clear hover', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const hoveredObj: HoveredObject = {
        id: 'galaxy-1',
        name: 'Milky Way',
        type: 'galaxy',
        position: new THREE.Vector3(10, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(hoveredObj);
      });
      expect(result.current.hoveredObject).not.toBeNull();

      act(() => {
        result.current.setHoveredObject(null);
      });
      expect(result.current.hoveredObject).toBeNull();
    });
  });

  describe('clearHover', () => {
    it('should clear hovered object', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const hoveredObj: HoveredObject = {
        id: 'galaxy-1',
        name: 'Milky Way',
        type: 'galaxy',
        position: new THREE.Vector3(10, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(hoveredObj);
      });
      expect(result.current.hoveredObject).not.toBeNull();

      act(() => {
        result.current.clearHover();
      });
      expect(result.current.hoveredObject).toBeNull();
    });
  });

  describe('Label Visibility', () => {
    it('should toggle labels visibility', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const initialVisibility = result.current.labelsVisible;
      
      act(() => {
        result.current.toggleLabelsVisibility();
      });
      expect(result.current.labelsVisible).toBe(!initialVisibility);

      act(() => {
        result.current.toggleLabelsVisibility();
      });
      expect(result.current.labelsVisible).toBe(initialVisibility);
    });

    it('should set labels visibility explicitly', () => {
      const { result } = renderHook(() => useHoverStore());
      
      act(() => {
        result.current.setLabelsVisibility(false);
      });
      expect(result.current.labelsVisible).toBe(false);

      act(() => {
        result.current.setLabelsVisibility(true);
      });
      expect(result.current.labelsVisible).toBe(true);
    });
  });

  describe('Metadata Handling', () => {
    it('should handle optional metadata fields', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const objWithMetadata: HoveredObject = {
        id: 'planet-1',
        name: 'Mars',
        type: 'planet',
        position: new THREE.Vector3(0, 0, 0),
        metadata: {
          description: 'The Red Planet',
          moonCount: 2,
          theme: 'red',
        },
      };

      act(() => {
        result.current.setHoveredObject(objWithMetadata);
      });

      expect(result.current.hoveredObject?.metadata?.description).toBe('The Red Planet');
      expect(result.current.hoveredObject?.metadata?.moonCount).toBe(2);
      expect(result.current.hoveredObject?.metadata?.theme).toBe('red');
    });

    it('should handle object without metadata', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const objWithoutMetadata: HoveredObject = {
        id: 'star-1',
        name: 'Betelgeuse',
        type: 'star',
        position: new THREE.Vector3(100, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(objWithoutMetadata);
      });

      expect(result.current.hoveredObject?.metadata).toBeUndefined();
    });
  });

  describe('Object Types', () => {
    it('should handle galaxy type', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const galaxy: HoveredObject = {
        id: 'gal-1',
        name: 'Andromeda',
        type: 'galaxy',
        position: new THREE.Vector3(0, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(galaxy);
      });

      expect(result.current.hoveredObject?.type).toBe('galaxy');
    });

    it('should handle solar-system type', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const solarSystem: HoveredObject = {
        id: 'sys-1',
        name: 'Solar System',
        type: 'solar-system',
        position: new THREE.Vector3(0, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(solarSystem);
      });

      expect(result.current.hoveredObject?.type).toBe('solar-system');
    });

    it('should handle planet type', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const planet: HoveredObject = {
        id: 'planet-1',
        name: 'Venus',
        type: 'planet',
        position: new THREE.Vector3(0, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(planet);
      });

      expect(result.current.hoveredObject?.type).toBe('planet');
    });

    it('should handle star type', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const star: HoveredObject = {
        id: 'star-1',
        name: 'Sirius',
        type: 'star',
        position: new THREE.Vector3(0, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(star);
      });

      expect(result.current.hoveredObject?.type).toBe('star');
    });
  });

  describe('Validation', () => {
    // Suppress console warnings during validation tests
    const originalWarn = console.warn;
    beforeEach(() => {
      console.warn = jest.fn();
    });
    afterEach(() => {
      console.warn = originalWarn;
    });

    it('should reject object with invalid position (NaN)', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const invalidObj = {
        id: 'test-1',
        name: 'Test',
        type: 'galaxy' as const,
        position: new THREE.Vector3(NaN, 0, 0),
      };

      act(() => {
        result.current.setHoveredObject(invalidObj);
      });

      // Should not update hoveredObject when position is invalid
      expect(result.current.hoveredObject).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Position contains invalid numbers'),
        expect.any(THREE.Vector3)
      );
    });

    it('should reject object with invalid position (Infinity)', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const invalidObj = {
        id: 'test-1',
        name: 'Test',
        type: 'planet' as const,
        position: new THREE.Vector3(0, Infinity, 0),
      };

      act(() => {
        result.current.setHoveredObject(invalidObj);
      });

      expect(result.current.hoveredObject).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should reject object without id', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const invalidObj = {
        name: 'Test',
        type: 'star' as const,
        position: new THREE.Vector3(0, 0, 0),
      } as any;

      act(() => {
        result.current.setHoveredObject(invalidObj);
      });

      expect(result.current.hoveredObject).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid object id'),
        expect.any(Object)
      );
    });

    it('should reject object without name', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const invalidObj = {
        id: 'test-1',
        type: 'galaxy' as const,
        position: new THREE.Vector3(0, 0, 0),
      } as any;

      act(() => {
        result.current.setHoveredObject(invalidObj);
      });

      expect(result.current.hoveredObject).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid object name'),
        expect.any(Object)
      );
    });

    it('should reject object without position', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const invalidObj = {
        id: 'test-1',
        name: 'Test',
        type: 'planet' as const,
      } as any;

      act(() => {
        result.current.setHoveredObject(invalidObj);
      });

      expect(result.current.hoveredObject).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid object position'),
        expect.any(Object)
      );
    });

    it('should accept valid object', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const validObj: HoveredObject = {
        id: 'test-1',
        name: 'Valid Test',
        type: 'galaxy',
        position: new THREE.Vector3(10, 20, 30),
      };

      act(() => {
        result.current.setHoveredObject(validObj);
      });

      expect(result.current.hoveredObject).toEqual(validObj);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid enter/leave events', () => {
      const { result } = renderHook(() => useHoverStore());
      
      const obj: HoveredObject = {
        id: 'obj-1',
        name: 'Test',
        type: 'planet',
        position: new THREE.Vector3(0, 0, 0),
      };

      // Rapidly set and clear
      act(() => {
        result.current.setHoveredObject(obj);
        result.current.setHoveredObject(null);
        result.current.setHoveredObject(obj);
        result.current.setHoveredObject(null);
      });

      // Final state should be null
      expect(result.current.hoveredObject).toBeNull();
    });

    it('should handle setLabelsVisibility with non-boolean gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const { result } = renderHook(() => useHoverStore());
      
      const initialVisibility = result.current.labelsVisible;

      act(() => {
        // @ts-expect-error Testing invalid input
        result.current.setLabelsVisibility('true');
      });

      // Should not change visibility with invalid input
      expect(result.current.labelsVisible).toBe(initialVisibility);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('setLabelsVisibility requires boolean'),
        'true'
      );

      console.warn = originalWarn;
    });
  });
});
