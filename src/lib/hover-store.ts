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

export const useHoverStore = create<HoverStore>((set) => ({
  hoveredObject: null,
  labelsVisible: true,

  setHoveredObject: (object: HoveredObject | null) =>
    set({ hoveredObject: object }),

  toggleLabelsVisibility: () =>
    set((state) => ({ labelsVisible: !state.labelsVisible })),

  setLabelsVisibility: (visible: boolean) =>
    set({ labelsVisible: visible }),

  clearHover: () => set({ hoveredObject: null }),
}));
