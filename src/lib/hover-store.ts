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
'use client';

/**
 * Hover state management for overlay labels
 * Tracks which objects are currently hovered and their 3D positions
 */

import { create } from 'zustand';
import * as THREE from 'three';

export type HoverableObjectType = 'galaxy' | 'solar-system' | 'planet' | 'star';

export interface HoveredObject {
  id: string;
  name: string;
  type: HoverableObjectType;
  position: THREE.Vector3;
  metadata?: {
    description?: string;
    planetCount?: number;
    moonCount?: number;
    theme?: string;
  };
}

interface HoverState {
  hoveredObject: HoveredObject | null;
  labelsVisible: boolean;
}

interface HoverStore extends HoverState {
  setHoveredObject: (object: HoveredObject | null) => void;
  toggleLabelsVisibility: () => void;
  setLabelsVisibility: (visible: boolean) => void;
  clearHover: () => void;
}

/**
 * Validates a HoveredObject to ensure it has valid data
 */
function validateHoveredObject(object: HoveredObject | null): boolean {
  if (!object) return true; // null is valid (clearing hover)
  
  if (!object.id || typeof object.id !== 'string') {
    console.warn('HoverStore: Invalid object id', object);
    return false;
  }
  
  if (!object.name || typeof object.name !== 'string') {
    console.warn('HoverStore: Invalid object name', object);
    return false;
  }
  
  // Check if position exists and is an object with required structure
  if (!object.position || typeof object.position !== 'object') {
    console.warn('HoverStore: Invalid object position', object);
    return false;
  }
  
  // Verify position has x, y, z properties that are numbers
  if (typeof object.position.x !== 'number' ||
      typeof object.position.y !== 'number' ||
      typeof object.position.z !== 'number') {
    console.warn('HoverStore: Position missing x/y/z coordinates', object.position);
    return false;
  }
  
  // Check for NaN or Infinity in position
  if (!isFinite(object.position.x) || 
      !isFinite(object.position.y) || 
      !isFinite(object.position.z)) {
    console.warn('HoverStore: Position contains invalid numbers', object.position);
    return false;
  }
  
  return true;
}

export const useHoverStore = create<HoverStore>((set) => ({
  hoveredObject: null,
  labelsVisible: true,

  setHoveredObject: (object: HoveredObject | null) => {
    // Validate and reject invalid objects
    if (!validateHoveredObject(object)) {
      return;
    }
    
    set({ hoveredObject: object });
  },

  toggleLabelsVisibility: () =>
    set((state) => ({ labelsVisible: !state.labelsVisible })),

  setLabelsVisibility: (visible: boolean) => {
    if (typeof visible !== 'boolean') {
      console.warn('HoverStore: setLabelsVisibility requires boolean', visible);
      return;
    }
    set({ labelsVisible: visible });
  },

  clearHover: () => set({ hoveredObject: null }),
}));
