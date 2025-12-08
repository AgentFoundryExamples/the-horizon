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
