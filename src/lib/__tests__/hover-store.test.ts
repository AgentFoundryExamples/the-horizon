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
});
